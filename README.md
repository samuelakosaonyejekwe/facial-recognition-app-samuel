# AWS Serverless Facial Recognition System

## 1. Overview
This project implements a cloud-native facial recognition system designed for secure, scalable, and real-time identity verification. The solution is built entirely on AWS managed services using a serverless architecture to eliminate infrastructure management while ensuring high availability and fault tolerance.

The system supports two primary operations:
- Registration of individuals into a recognition database
- Authentication of individuals through facial comparison

---

## 2. System Architecture

The architecture is composed of two independent but connected workflows:

### 2.1 Registration Workflow
An image uploaded to Amazon S3 triggers a Lambda function that processes the image using Amazon Rekognition. The detected facial features are indexed, and the resulting facial identifier is stored in DynamoDB along with user metadata.

### 2.2 Authentication Workflow
A client submits an image via an API Gateway endpoint. The request is forwarded to a Lambda function, which compares the submitted image against stored facial records using Rekognition. The result is validated against DynamoDB and returned to the client.

---

## 3. Core AWS Services

### 3.1 Amazon S3
Used as the storage layer for:
- Employee images (registration dataset)
- Visitor images (authentication input)

S3 also acts as an event source for triggering the registration Lambda function.

### 3.2 AWS Lambda
Two functions implement the compute layer:

- employee-registration  
  Triggered by S3 events. Performs face indexing and writes results to DynamoDB.

- employee-authentication  
  Invoked via API Gateway. Performs face comparison and returns identity match results.

### 3.3 Amazon Rekognition
Provides the machine learning capability for:
- Face detection
- Face indexing into collections
- Face comparison with similarity scoring

### 3.4 Amazon DynamoDB
Stores structured identity records including:
- Rekognition Face ID
- First name and last name
- Image reference metadata

The database enables fast lookup during authentication.

### 3.5 Amazon API Gateway
Exposes a REST endpoint for authentication:
- Resource: /bucket
- Method: POST

It acts as the interface between the frontend and backend Lambda function.

### 3.6 AWS IAM
Controls access between services using least-privilege roles:
- Lambda execution roles
- Rekognition access permissions
- S3 and DynamoDB access policies

### 3.7 Amazon CloudWatch
Used for:
- Logging Lambda execution
- Monitoring system activity
- Debugging and validation

---

## 4. Data Flow

### 4.1 Registration
1. Image uploaded to S3
2. S3 triggers Lambda
3. Lambda calls Rekognition to index face
4. Rekognition returns Face ID
5. Lambda stores record in DynamoDB

### 4.2 Authentication
1. Client sends image via API Gateway
2. API Gateway invokes Lambda
3. Lambda calls Rekognition to compare faces
4. Rekognition returns similarity score
5. Lambda queries DynamoDB
6. Response returned to client

---

## 5. Security Design

The system implements multiple layers of security:

- IAM roles with least-privilege access
- No direct public access to backend services
- API Gateway secured with API keys and usage plans
- Controlled access to S3 buckets
- Monitoring via CloudWatch logs

---

## 6. Performance and Scalability

The system is designed for scalability and efficiency:

- Lambda provides automatic scaling based on demand
- DynamoDB operates in on-demand mode for flexible throughput
- S3 provides highly durable and scalable storage
- API Gateway supports high request concurrency

The serverless model ensures cost efficiency by charging only for actual usage.

---

## 7. Validation and Testing

System validation was performed through:

- Successful image uploads triggering registration workflow
- Verified storage of facial records in DynamoDB
- Accurate face comparison results using Rekognition
- API Gateway endpoint testing with valid and invalid inputs
- CloudWatch logs confirming execution paths

---

## 8. Project Structure

facial-recognition-app/  
Frontend application built with React (Vite)

facial_recognition_py_files/  
Python-based Lambda functions for registration and authentication

people pics/  
Dataset used for employee and visitor images

Screenshots/  
Execution evidence and system output validation

REPORT_Project2_Samuel-A.-O.pdf  
Full technical report describing design and implementation

---

## 9. Deployment Environment

- Cloud Provider: Amazon Web Services
- Region: eu-west-1
- Architecture Type: Serverless, event-driven, API-driven

---

## 10. Use Cases

- Secure access control systems
- Identity verification platforms
- Banking and KYC solutions
- Enterprise authentication systems

---

## 11. Conclusion

The system demonstrates how AWS serverless services can be integrated to build a scalable and secure facial recognition platform. The architecture eliminates infrastructure overhead while maintaining performance, reliability, and extensibility.

---

## Author
Samuel Akosa Onyejekwe
Cloud Engineer and DevOps Practitioner
