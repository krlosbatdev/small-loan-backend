import { DocumentProcessor } from "../libs/textract.lib";


export async function main(event: any, context:any) {

  //https://gist.github.com/marteinn/c1071b5e22086ace14cca38ec4460fb8

  //https://github.com/aeksco/aws-pdf-textract-pipeline/blob/master/src/send-pdf-to-textract/lambda.ts

  const analyzer = new DocumentProcessor();
  // Get the object from the event and show its content type
  const bucket = event['Records'][0]['s3']['bucket']['name'];
  const key = event['Records'][0]['s3']['object']['key'];
  try {
    await analyzer.main(bucket, key)

    return 'Processing Done!'
  } catch (e) {
    console.log(e);
    // console.log('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))
    // raise e
  }

}