import AWS from 'aws-sdk';

enum ProcessType {
  DETECTION = 'DETECTION',
  ANALYSIS = 'ANALYSIS',
}
export class DocumentProcessor {
  textract = new AWS.Textract();
  sqs = new AWS.SQS();
  sns = new AWS.SNS();
  s3 = new AWS.S3();
  jobId = '';
  roleArn = '';
  bucket = '';
  document = '';
  sqsQueueUrl = '';
  snsTopicArn = '';
  processType = '';

  async main(bucketName: string, documentName: string) {
    //TODO - Change role arn to environment variable
    this.roleArn = 'arn:aws:iam::124744339772:role/service-role/TextractS3-role-iars313u';

    this.bucket = bucketName;
    this.document = documentName;

    await this.CreateTopicandQueue();
    await this.ProcessDocument(ProcessType.ANALYSIS);
    this.DeleteTopicandQueue();
  }

  async ProcessDocument(type: string | ProcessType) {
    let jobFound = false;

    this.processType = type;
    let validType = false;
    let response: any = null;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    try {
      // Determine which type of processing to perform
      if (this.processType === ProcessType.DETECTION) {
        response = this.textract
          .startDocumentTextDetection({
            DocumentLocation: {
              S3Object: {
                Bucket: this.bucket,
                Name: this.document,
              },
            },
            NotificationChannel: {
              RoleArn: this.roleArn,
              SNSTopicArn: this.snsTopicArn,
            },
          })
          .promise()
          .catch((err) => {
            console.error(err);
          });

        console.log('Processing type: Detection');
        validType = true;
      }
      if (this.processType === ProcessType.ANALYSIS) {
        try {
          response = await this.textract
            .startDocumentAnalysis({
              DocumentLocation: {
                S3Object: {
                  Bucket: this.bucket,
                  Name: this.document,
                },
              },
              FeatureTypes: ['TABLES', 'FORMS'],
              NotificationChannel: {
                RoleArn: this.roleArn,
                SNSTopicArn: this.snsTopicArn,
              },
            })
            .promise();
        } catch (error) {
          console.log(error);
        }

        console.log('Processing type: Analysis');
        validType = true;
      }
      if (validType === false) {
        console.log('Invalid processing type. Choose Detection or Analysis.');
        return;
      }

      console.log('Start Job Id: ' + response['JobId']);
      let dotLine = 0;

      while (jobFound === false) {
        let sqsResponse = await this.sqs
          .receiveMessage({
            QueueUrl: this.sqsQueueUrl,
            MessageAttributeNames: ['ALL'],
            MaxNumberOfMessages: 10,
          })
          .promise()
          .catch((err) => {
            console.error(err);
          });

        if (sqsResponse) {
          if (!sqsResponse['Messages']) {
            if (dotLine < 40) {
              console.log('.');
              dotLine = dotLine + 1;
            } else {
              console.log();
              dotLine = 0;
            }
            await delay(5000);
            continue;
          }

          for (const message of sqsResponse['Messages']) {
            let notification = !!message.Body ? JSON.parse(message.Body) : '';

            let textMessage = JSON.parse(notification['Message']);

            console.log('Textract job Id:' + textMessage['JobId']);
            console.log('Textract job status:' + textMessage['Status']);

            if (textMessage['JobId'] === response['JobId']) {
              console.log('Matching Job Found:' + textMessage['JobId']);

              jobFound = true;

              let results = await this.GetResults(textMessage['JobId']);

              await this.StoreInS3(results);

              await this.sqs
                .deleteMessage({
                  QueueUrl: this.sqsQueueUrl || '',
                  ReceiptHandle: message.ReceiptHandle || '',
                })
                .promise()
                .catch((err) => {
                  console.error(err);
                });
            } else {
              console.log("Job didn't match:" + textMessage['JobId'] + ' : ' + response['JobId']); //Delete the unknown message.Consider sending to dead letter queue
              await this.sqs
                .deleteMessage({
                  QueueUrl: this.sqsQueueUrl || '',
                  ReceiptHandle: message.ReceiptHandle || '',
                })
                .promise()
                .catch((err) => {
                  console.error(err);
                });
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }

    console.log('Process Document Done!');
  }

  async StoreInS3(response: any) {
    try {
      console.log('uploading json to s3 bucket...');
      const outputInJsonText = JSON.stringify(response);
      const pdfTextExtractionS3ObjectName = this.document.replace('.pdf', '');
      const pdfTextExtractionS3Bucket = this.bucket;

      const outputFileName = 'json/' + pdfTextExtractionS3ObjectName + '.json';
      await this.s3
        .putObject({
          Body: outputInJsonText,
          Bucket: pdfTextExtractionS3Bucket,
          Key: outputFileName,
        })
        .promise()
        .catch((err) => {
          console.error(err);
        });
      console.log('file ' + outputFileName + ' uploaded successfully!');
    } catch (error) {
      console.log(error);
    }
  }

  async CreateTopicandQueue() {
    //https://matoski.com/article/snssqs-for-node-js/
    const millis = Date.now();

    //Create SNS topic
    const snsTopicName = 'AmazonTextractTopic' + millis;
    try {
      const createTopicPromise = this.sns
        .createTopic({
          Name: snsTopicName,
        })
        .promise();

      console.log('SNS topic created' + this.snsTopicArn);
      this.snsTopicArn = (await createTopicPromise).TopicArn || '';
    } catch (err) {
      console.log('Create topic error: ' + err);
    }

    // create SQS queue
    const sqsQueueName = 'AmazonTextractQueue' + millis;
    try {
      const queResponse = await this.sqs
        .createQueue({
          QueueName: sqsQueueName,
        })
        .promise();

      this.sqsQueueUrl = queResponse.QueueUrl || '';
    } catch (error) {
      console.log(error);
    }

    //get queue arn
    let sqsQueueArn;
    try {
      const attribs = await this.sqs
        .getQueueAttributes({
          QueueUrl: this.sqsQueueUrl,
          AttributeNames: ['QueueArn'],
        })
        .promise();

      sqsQueueArn = attribs['Attributes'] ? attribs['Attributes']['QueueArn'] : '';
    } catch (error) {
      console.log(error);
    }

    console.log('SQS queue created' + sqsQueueArn);

    // Subscribe SQS queue to SNS topic
    try {
      const subscribePromise = await this.sns
        .subscribe({
          TopicArn: this.snsTopicArn,
          Protocol: 'sqs',
          Endpoint: sqsQueueArn,
        })
        .promise();

      console.log('Subscription created' + subscribePromise.SubscriptionArn);
    } catch (error) {
      console.log(error);
    }

    // Authorize SNS to write SQS queue
    const policy = {
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 'sqs:SendMessage',
          Resource: sqsQueueArn,
          Condition: {
            ArnEquals: {
              'aws:SourceArn': this.snsTopicArn,
            },
          },
        },
      ],
    };

    try {
      const response = await this.sqs
        .setQueueAttributes({
          QueueUrl: this.sqsQueueUrl,
          Attributes: {
            Policy: JSON.stringify(policy),
          },
        })
        .promise();

      console.log('Subscription created' + response.$response.data);
    } catch (error) {
      console.log(error);
    }
  }

  DeleteTopicandQueue() {
    this.sqs
      .deleteQueue({
        QueueUrl: this.sqsQueueUrl,
      })
      .promise()
      .catch((err) => {
        console.error(err);
      });

    this.sns
      .deleteTopic({
        TopicArn: this.snsTopicArn,
      })
      .promise()
      .catch((err) => {
        console.error(err);
      });
  }

  async GetResults(jobId: any) {
    try {
      const maxResults = 1000;
      let paginationToken = null;
      let finished = false;
      let pages = [];

      while (finished === false) {
        let response = null;

        if (this.processType === ProcessType.ANALYSIS) {
          if (paginationToken === null)
            response = await this.textract
              .getDocumentAnalysis({
                JobId: jobId,
                MaxResults: maxResults,
              })
              .promise()
              .catch((err) => {
                console.error(err);
              });
        }

        //Put response on pages list
        if (response) {
          pages.push(response);
          console.log('Document Detected.');
        }

        if (response && response['NextToken']) {
          paginationToken = response['NextToken'];
        } else {
          finished = true;
        }
      }
      //convert pages as JSON pattern

      return pages;
    } catch (error) {
      console.log(error);
    }
  }
}
