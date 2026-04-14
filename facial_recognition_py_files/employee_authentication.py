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
        body = json.loads(event.get('body', '{}'))

        image_base64 = body.get('image')

        if not image_base64:
            return response(400, "Missing image")

        image_bytes = base64.b64decode(image_base64)

        image_id = str(uuid.uuid4())
        image_key = f"visitors/{image_id}.jpeg"

        # Upload visitor image
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=image_key,
            Body=image_bytes,
            ContentType='image/jpeg'
        )

        # 🔥 AUTHENTICATION (REAL FIX)
        rek_response = rekognition.search_faces_by_image(
            CollectionId=COLLECTION_ID,
            Image={
                'S3Object': {
                    'Bucket': BUCKET_NAME,
                    'Name': image_key
                }
            },
            MaxFaces=1,
            FaceMatchThreshold=85
        )

        matches = rek_response.get('FaceMatches', [])

        if not matches:
            return response(200, {"Message": "Failure"})

        face_id = matches[0]['Face']['FaceId']

        table = dynamodb.Table(TABLE_NAME)

        res = table.get_item(
            Key={'rekognitionid': face_id}
        )

        if 'Item' not in res:
            return response(200, {"Message": "Failure"})

        user = res['Item']

        return response(200, {
            "Message": "Success",
            "firstName": user['FirstName'],
            "lastName": user['LastName']
        })

    except Exception as e:
        print(e)
        return response(500, "AWS error")


def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*'
        },
        'body': json.dumps(body)
    }
