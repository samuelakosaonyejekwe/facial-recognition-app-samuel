import json
import boto3
import base64
import uuid

s3 = boto3.client('s3', region_name='eu-west-1')
rekognition = boto3.client('rekognition', region_name='eu-west-1')
dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')

BUCKET_NAME = 'samuel-visitor-images'
COLLECTION_ID = 'employees'
TABLE_NAME = 'employee'


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body') or "{}")
        image_base64 = body.get('image')

        if not image_base64:
            return response(400, {"status": "Missing image"})

        # 🔥 SAFE BASE64 DECODE
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception:
            return response(400, {"status": "Invalid image format"})

        # 🔥 VALIDATE IMAGE SIZE (CRITICAL FIX)
        print("Image bytes size:", len(image_bytes))

        image_id = str(uuid.uuid4())
        image_key = f"visitors/{image_id}.jpeg"

        # Save image
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=image_key,
            Body=image_bytes,
            ContentType='image/jpeg'
        )

        # 🔥 SAFE DETECT FACES
        try:
            detect_response = rekognition.detect_faces(
                Image={'Bytes': image_bytes},
                Attributes=[]
            )
        except Exception as e:
            print("Detect error:", e)
            return response(200, {"status": "No face"})

        face_details = detect_response.get('FaceDetails', [])

        bbox = None
        if face_details:
            bbox = face_details[0]['BoundingBox']

        # 🔥 SAFE FACE MATCH
        try:
            rek_response = rekognition.search_faces_by_image(
                CollectionId=COLLECTION_ID,
                Image={'Bytes': image_bytes},
                MaxFaces=1,
                FaceMatchThreshold=85
            )
        except Exception as e:
            print("Search error:", e)
            return response(200, {"status": "No face"})

        matches = rek_response.get('FaceMatches', [])

        if not matches:
            return response(200, {
                "status": "Failure",
                "box": bbox
            })

        face_id = matches[0]['Face']['FaceId']

        table = dynamodb.Table(TABLE_NAME)
        res = table.get_item(Key={'rekognitionid': face_id})

        if 'Item' not in res:
            return response(200, {
                "status": "Failure",
                "box": bbox
            })

        user = res['Item']

        return response(200, {
            "status": "Success",
            "name": f"{user['FirstName']} {user['LastName']}",
            "box": bbox
        })

    except Exception as e:
        print("FATAL:", e)
        return response(500, {"status": "AWS error"})


def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*'
        },
        'body': json.dumps(body)
    }