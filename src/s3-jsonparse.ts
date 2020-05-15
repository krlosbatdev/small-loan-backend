
import { getJsonFromS3, getSanitizedKeyValues, addKeyValuesToDynamoDB } from '../libs/parse-json.lib';

export async function main(event: any, context: any) {
  // Logs starting message
  console.log('send-textract-result-to-dynamo - start');
  console.log(JSON.stringify(event, null, 4));
  let bucket;
  let key;

  try {
    bucket = event['Records'][0]['s3']['bucket']['name'];
    key = event['Records'][0]['s3']['object']['key'];
  } catch (e) {
    console.log('Error parsing file info from event');
    console.log(e);
    return;
  }

  console.log('bucket: ' + bucket);
  console.log('key: ' + key);

  let data = await getJsonFromS3({ bucket, key }).catch((err) => {
    console.log('Error reading json file form s3');
    console.log(err);
    return;
  });

  const sanitizedKvPairs: { [key: string]: string } = getSanitizedKeyValues(data);

  await addKeyValuesToDynamoDB(sanitizedKvPairs);

  // Logs shutdown message
  console.log('send-textract-result-to-dynamo - shutdown');
}
