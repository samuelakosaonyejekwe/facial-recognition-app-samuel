import json
import boto3
from urllib.parse import unquote_plus

# -------------------------------
# CONFIG (YOUR REAL VALUES)
# -------------------------------
REGION = 'eu-west-1'
BUCKET_NAME = 'samuel-employee-images'   # ✅ YOUR BUCKET
TABLE_NAME = 'employee'
COLLECTION_ID = 'employees'

rekognition = boto3.client('rekognition', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

# -------------------------------
# LAMBDA HANDLER
# -------------------------------
def lambda_handler(event, context):
    try:
        print("EVENT:", json.dumps(event))

        for record in event['Records']:

            # -------------------------------
            # FORCE YOUR BUCKET
            # -------------------------------
            bucket = BUCKET_NAME
            key = unquote_plus(record['s3']['object']['key'])

            print(f"Processing: {key}")

            # -------------------------------
            # REKOGNITION
            # -------------------------------
            response = rekognition.index_faces(
                CollectionId=COLLECTION_ID,
                Image={
                    'S3Object': {
                        'Bucket': bucket,
                        'Name': key
                    }
                },
                ExternalImageId=key,
                MaxFaces=1,
                QualityFilter='AUTO'
            )

            print("Rekognition:", json.dumps(response))

            face_records = response.get('FaceRecords', [])

            if not face_records:
                print("No face detected")
                continue

            face_id = face_records[0]['Face']['FaceId']

            print("Face ID:", face_id)

            # -------------------------------
            # DYNAMODB (CORRECT KEY)
            # -------------------------------
            table.put_item(
                Item={
                    'rekognitionid': face_id,
                    'ImageKey': key,
                    'FirstName': 'Auto',
                    'LastName': 'Registered'
                }
            )

            print("Saved to DynamoDB")

        return {
            'statusCode': 200,
            'body': json.dumps("Done")
        }

    except Exception as e:
        print("ERROR:", str(e))
        raise e