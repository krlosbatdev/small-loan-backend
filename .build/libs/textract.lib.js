"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var aws_sdk_1 = __importDefault(require("aws-sdk"));
var ProcessType;
(function (ProcessType) {
    ProcessType["DETECTION"] = "DETECTION";
    ProcessType["ANALYSIS"] = "ANALYSIS";
})(ProcessType || (ProcessType = {}));
var DocumentProcessor = /** @class */ (function () {
    function DocumentProcessor() {
        this.textract = new aws_sdk_1.default.Textract();
        this.sqs = new aws_sdk_1.default.SQS();
        this.sns = new aws_sdk_1.default.SNS();
        this.s3 = new aws_sdk_1.default.S3();
        this.jobId = '';
        this.roleArn = '';
        this.bucket = '';
        this.document = '';
        this.sqsQueueUrl = '';
        this.snsTopicArn = '';
        this.processType = '';
    }
    DocumentProcessor.prototype.main = function (bucketName, documentName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        //TODO - Change role arn to environment variable
                        this.roleArn = 'arn:aws:iam::124744339772:role/service-role/TextractS3-role-iars313u';
                        this.bucket = bucketName;
                        this.document = documentName;
                        return [4 /*yield*/, this.CreateTopicandQueue()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.ProcessDocument(ProcessType.ANALYSIS)];
                    case 2:
                        _a.sent();
                        this.DeleteTopicandQueue();
                        return [2 /*return*/];
                }
            });
        });
    };
    DocumentProcessor.prototype.ProcessDocument = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            var jobFound, validType, response, error_1, dotLine, sqsResponse, _i, _a, message, notification, textMessage, results, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        jobFound = false;
                        this.processType = type;
                        validType = false;
                        response = null;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 18, , 19]);
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
                                .catch(function (err) {
                                console.error(err);
                            });
                            console.log('Processing type: Detection');
                            validType = true;
                        }
                        if (!(this.processType === ProcessType.ANALYSIS)) return [3 /*break*/, 6];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.textract
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
                                .promise()];
                    case 3:
                        response = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        console.log(error_1);
                        return [3 /*break*/, 5];
                    case 5:
                        console.log('Processing type: Analysis');
                        validType = true;
                        _b.label = 6;
                    case 6:
                        if (validType === false) {
                            console.log('Invalid processing type. Choose Detection or Analysis.');
                            return [2 /*return*/];
                        }
                        console.log('Start Job Id: ' + response['JobId']);
                        dotLine = 0;
                        _b.label = 7;
                    case 7:
                        if (!(jobFound === false)) return [3 /*break*/, 17];
                        return [4 /*yield*/, this.sqs
                                .receiveMessage({
                                QueueUrl: this.sqsQueueUrl,
                                MessageAttributeNames: ['ALL'],
                                MaxNumberOfMessages: 10,
                            })
                                .promise()
                                .catch(function (err) {
                                console.error(err);
                            })];
                    case 8:
                        sqsResponse = _b.sent();
                        if (!sqsResponse) return [3 /*break*/, 16];
                        if (!sqsResponse['Messages']) {
                            if (dotLine < 40) {
                                console.log('.');
                                dotLine = dotLine + 1;
                            }
                            else {
                                console.log();
                                dotLine = 0;
                            }
                            this.wait(5000);
                            return [3 /*break*/, 7];
                        }
                        _i = 0, _a = sqsResponse['Messages'];
                        _b.label = 9;
                    case 9:
                        if (!(_i < _a.length)) return [3 /*break*/, 16];
                        message = _a[_i];
                        notification = !!message.Body ? JSON.parse(message.Body) : '';
                        textMessage = JSON.parse(notification['Message']);
                        console.log('Textract job Id:' + textMessage['JobId']);
                        console.log('Textract job status:' + textMessage['Status']);
                        if (!(textMessage['JobId'] === response['JobId'])) return [3 /*break*/, 13];
                        console.log('Matching Job Found:' + textMessage['JobId']);
                        jobFound = true;
                        return [4 /*yield*/, this.GetResults(textMessage['JobId'])];
                    case 10:
                        results = _b.sent();
                        return [4 /*yield*/, this.StoreInS3(results)];
                    case 11:
                        _b.sent();
                        return [4 /*yield*/, this.sqs
                                .deleteMessage({
                                QueueUrl: this.sqsQueueUrl || '',
                                ReceiptHandle: message.ReceiptHandle || '',
                            })
                                .promise()
                                .catch(function (err) {
                                console.error(err);
                            })];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 15];
                    case 13:
                        console.log("Job didn't match:" + textMessage['JobId'] + ' : ' + response['JobId']); //Delete the unknown message.Consider sending to dead letter queue
                        return [4 /*yield*/, this.sqs
                                .deleteMessage({
                                QueueUrl: this.sqsQueueUrl || '',
                                ReceiptHandle: message.ReceiptHandle || '',
                            })
                                .promise()
                                .catch(function (err) {
                                console.error(err);
                            })];
                    case 14:
                        _b.sent();
                        _b.label = 15;
                    case 15:
                        _i++;
                        return [3 /*break*/, 9];
                    case 16: return [3 /*break*/, 7];
                    case 17: return [3 /*break*/, 19];
                    case 18:
                        error_2 = _b.sent();
                        console.log(error_2);
                        return [3 /*break*/, 19];
                    case 19:
                        console.log('Done!');
                        return [2 /*return*/];
                }
            });
        });
    };
    DocumentProcessor.prototype.wait = function (ms) {
        var start = new Date().getTime();
        var end = start;
        while (end < start + ms) {
            end = new Date().getTime();
        }
    };
    DocumentProcessor.prototype.StoreInS3 = function (response) {
        return __awaiter(this, void 0, void 0, function () {
            var outputInJsonText, pdfTextExtractionS3ObjectName, pdfTextExtractionS3Bucket, outputFileName, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('uploading json to s3 bucket...');
                        outputInJsonText = JSON.stringify(response);
                        pdfTextExtractionS3ObjectName = this.document.replace('.pdf', '');
                        pdfTextExtractionS3Bucket = this.bucket;
                        outputFileName = 'json/' + pdfTextExtractionS3ObjectName + '.json';
                        return [4 /*yield*/, this.s3
                                .putObject({
                                Body: outputInJsonText,
                                Bucket: pdfTextExtractionS3Bucket,
                                Key: outputFileName,
                            })
                                .promise()
                                .catch(function (err) {
                                console.error(err);
                            })];
                    case 1:
                        _a.sent();
                        console.log('file ' + outputFileName + ' uploaded successfully!');
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.log(error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DocumentProcessor.prototype.CreateTopicandQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var millis, snsTopicName, createTopicPromise, _a, err_1, sqsQueueName, queResponse, error_4, sqsQueueArn, attribs, error_5, subscribePromise, error_6, policy, response, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        millis = Date.now();
                        snsTopicName = 'AmazonTextractTopic' + millis;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        createTopicPromise = this.sns
                            .createTopic({
                            Name: snsTopicName,
                        })
                            .promise();
                        console.log('SNS topic created' + this.snsTopicArn);
                        _a = this;
                        return [4 /*yield*/, createTopicPromise];
                    case 2:
                        _a.snsTopicArn = (_b.sent()).TopicArn || '';
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _b.sent();
                        console.log('Create topic error: ' + err_1);
                        return [3 /*break*/, 4];
                    case 4:
                        sqsQueueName = 'AmazonTextractQueue' + millis;
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.sqs
                                .createQueue({
                                QueueName: sqsQueueName,
                            })
                                .promise()];
                    case 6:
                        queResponse = _b.sent();
                        this.sqsQueueUrl = queResponse.QueueUrl || '';
                        return [3 /*break*/, 8];
                    case 7:
                        error_4 = _b.sent();
                        console.log(error_4);
                        return [3 /*break*/, 8];
                    case 8:
                        _b.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, this.sqs
                                .getQueueAttributes({
                                QueueUrl: this.sqsQueueUrl,
                                AttributeNames: ['QueueArn'],
                            })
                                .promise()];
                    case 9:
                        attribs = _b.sent();
                        sqsQueueArn = attribs['Attributes'] ? attribs['Attributes']['QueueArn'] : '';
                        return [3 /*break*/, 11];
                    case 10:
                        error_5 = _b.sent();
                        console.log(error_5);
                        return [3 /*break*/, 11];
                    case 11:
                        console.log('SQS queue created' + sqsQueueArn);
                        _b.label = 12;
                    case 12:
                        _b.trys.push([12, 14, , 15]);
                        return [4 /*yield*/, this.sns
                                .subscribe({
                                TopicArn: this.snsTopicArn,
                                Protocol: 'sqs',
                                Endpoint: sqsQueueArn,
                            })
                                .promise()];
                    case 13:
                        subscribePromise = _b.sent();
                        console.log('Subscription created' + subscribePromise.SubscriptionArn);
                        return [3 /*break*/, 15];
                    case 14:
                        error_6 = _b.sent();
                        console.log(error_6);
                        return [3 /*break*/, 15];
                    case 15:
                        policy = {
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
                        _b.label = 16;
                    case 16:
                        _b.trys.push([16, 18, , 19]);
                        return [4 /*yield*/, this.sqs
                                .setQueueAttributes({
                                QueueUrl: this.sqsQueueUrl,
                                Attributes: {
                                    Policy: JSON.stringify(policy),
                                },
                            })
                                .promise()];
                    case 17:
                        response = _b.sent();
                        console.log('Subscription created' + response.$response.data);
                        return [3 /*break*/, 19];
                    case 18:
                        error_7 = _b.sent();
                        console.log(error_7);
                        return [3 /*break*/, 19];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    DocumentProcessor.prototype.DeleteTopicandQueue = function () {
        this.sqs
            .deleteQueue({
            QueueUrl: this.sqsQueueUrl,
        })
            .promise()
            .catch(function (err) {
            console.error(err);
        });
        this.sns
            .deleteTopic({
            TopicArn: this.snsTopicArn,
        })
            .promise()
            .catch(function (err) {
            console.error(err);
        });
    };
    DocumentProcessor.prototype.GetResults = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var maxResults, paginationToken, finished, pages, response, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        maxResults = 1000;
                        paginationToken = null;
                        finished = false;
                        pages = [];
                        _a.label = 1;
                    case 1:
                        if (!(finished === false)) return [3 /*break*/, 4];
                        response = null;
                        if (!(this.processType === ProcessType.ANALYSIS)) return [3 /*break*/, 3];
                        if (!(paginationToken === null)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.textract
                                .getDocumentAnalysis({
                                JobId: jobId,
                                MaxResults: maxResults,
                            })
                                .promise()
                                .catch(function (err) {
                                console.error(err);
                            })];
                    case 2:
                        response = _a.sent();
                        _a.label = 3;
                    case 3:
                        // else {
                        //   response = await this.textract
                        //     .getDocumentAnalysis({
                        //       JobId: jobId,
                        //       MaxResults: maxResults,
                        //       NextToken: paginationToken,
                        //     })
                        //     .promise()
                        //     .catch((err) => {
                        //       console.error(err);
                        //     });
                        // }
                        // if (this.processType === ProcessType.DETECTION) {
                        //   if (paginationToken === null) {
                        //     response = await this.textract
                        //       .getDocumentTextDetection({
                        //         JobId: jobId,
                        //         MaxResults: maxResults,
                        //       })
                        //       .promise()
                        //       .catch((err) => {
                        //         console.error(err);
                        //       });
                        //   } else {
                        //     response = await this.textract
                        //       .getDocumentTextDetection({
                        //         JobId: jobId,
                        //         MaxResults: maxResults,
                        //         NextToken: paginationToken,
                        //       })
                        //       .promise()
                        //       .catch((err) => {
                        //         console.error(err);
                        //       });
                        //   }
                        // }
                        //Put response on pages list
                        if (response) {
                            pages.push(response);
                            console.log('Document Detected.');
                        }
                        if (response && response['NextToken']) {
                            paginationToken = response['NextToken'];
                        }
                        else {
                            finished = true;
                        }
                        return [3 /*break*/, 1];
                    case 4: 
                    //convert pages as JSON pattern
                    return [2 /*return*/, pages];
                    case 5:
                        error_8 = _a.sent();
                        console.log(error_8);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return DocumentProcessor;
}());
exports.DocumentProcessor = DocumentProcessor;
//# sourceMappingURL=textract.lib.js.map