const nock = require("nock");
const index = require("./index.js");

// モック化する代わりに実際に通信して内容をキャプチャする。
// 通信内容はscopeの形式で標準出力に出力される。
//nock.recorder.rec();

describe("httpsRequest", () => {
    beforeAll(() => {
        nock.disableNetConnect();
    });

    afterAll(() => {
        nock.enableNetConnect();
    });

    beforeEach(() => {
        nock.cleanAll();
    });

    test("単純な場合", async () => {
        const scope = nock("https://httpbin.org")
            .get("/get")
            .reply(200, {
                message: "dummy",
            });
        let res = await index.httpsRequest("https://httpbin.org/get");
        expect(res.statusCode).toEqual(200);
        expect(scope.isDone()).toEqual(true);
        expect(nock.isDone()).toEqual(true);
    });

    test("クエリーパラメータを含む場合", async () => {
        const scope = nock("https://httpbin.org")
            .get("/get")
            .query({ a: "abc" })
            .reply(200, {
                message: "dummy",
            })
            .get("/get")
            .query({ b: "123" })
            .reply(400)
        ;
        let promises = [
            index.httpsRequest("https://httpbin.org/get?b=123"),
            index.httpsRequest("https://httpbin.org/get?a=abc"),
        ];
        let results = await Promise.all(promises);
        expect(results[0].statusCode).toEqual(400);
        expect(results[1].statusCode).toEqual(200);
        expect(nock.isDone()).toEqual(true);
    });

    test("scopeが2個ある場合", async () => {
        const scope1 = nock("https://httpbin.org")
            .get("/get")
            .query({ a: "abc" })
            .reply(200, {
                message: "dummy",
            })
        ;
        const scope2 = nock("https://example.com")
            .get("/")
            .reply(200, {
                message: "dummy",
            })
        ;
        let promises = [
            index.httpsRequest("https://httpbin.org/get?a=abc"),
            index.httpsRequest("https://example.com/"),
        ];
        let results = await Promise.all(promises);
        expect(results[0].statusCode).toEqual(200);
        expect(results[1].statusCode).toEqual(200);
        expect(nock.isDone()).toEqual(true);
    });

    test("DynamoDB putのテスト", async () => {
        //nock('https://dynamodb.ap-northeast-1.amazonaws.com:443', {"encodedQueryParams":true})
        //    .post('/', {"TableName":"emot2bff-aoyama-study1","Item":{"category":{"S":"mogemoge"},"key":{"S":"asd"},"createdAt":{"S":"2020-08-28T01:43:42.991Z"}}})
        //    .reply(200, {}, [
        //        'Server',
        //        'Server',
        //        'Date',
        //        'Fri, 28 Aug 2020 01:43:43 GMT',
        //        'Content-Type',
        //        'application/x-amz-json-1.0',
        //        'Content-Length',
        //        '2',
        //        'Connection',
        //        'keep-alive',
        //        'x-amzn-RequestId',
        //        'TR12LBAR1FB4KIFAV51M0H9OQ7VV4KQNSO5AEMVJF66Q9ASUAAJG',
        //        'x-amz-crc32',
        //        '2745614147'
        //    ]);
    nock('https://dynamodb.ap-northeast-1.amazonaws.com:443', {"encodedQueryParams":true})
      .post('/', {"TableName":"emot2bff-aoyama-study1","Item":{"category":{"S":"mogemoge"},"key":{"S":"asd"},"createdAt":{"S":"2020-08-28T01:49:22.064Z"}}})
      .reply(200, {}, [
      'Server',
      'Server',
      'Date',
      'Fri, 28 Aug 2020 01:49:23 GMT',
      'Content-Type',
      'application/x-amz-json-1.0',
      'Content-Length',
      '2',
      'Connection',
      'keep-alive',
      'x-amzn-RequestId',
      'T3G14NRRC49G499MEI4LASQM6BVV4KQNSO5AEMVJF66Q9ASUAAJG',
      'x-amz-crc32',
      '2745614147'
    ]);
        let res = await index.dynamoDbPut();
        expect(res).toEqual({});
    }, 2000);

    test("DynamoDB queryのテスト", async () => {
        nock('https://dynamodb.ap-northeast-1.amazonaws.com:443', {"encodedQueryParams":true})
            .post('/', {
                "TableName": "emot2bff-aoyama-study1",
                "KeyConditionExpression": "#category = :category",
                "ExpressionAttributeNames": {
                    "#category": "category"
                },
                "ExpressionAttributeValues": {
                    ":category": {
                        "S": "mogemoge"
                    }
                }
            })
            .reply(200, {"Count":1,"Items":[{"category":{"S":"mogemoge"},"key":{"S":"asd"},"createdAt":{"S":"2020-08-28T01:43:42.991Z"}}],"ScannedCount":1}, [
                'Server',
                'Server',
                'Date',
                'Fri, 28 Aug 2020 01:43:43 GMT',
                'Content-Type',
                'application/x-amz-json-1.0',
                'Content-Length',
                '131',
                'Connection',
                'keep-alive',
                'x-amzn-RequestId',
                '3C7GG0NNRLI81OVTKRS1HEU3TFVV4KQNSO5AEMVJF66Q9ASUAAJG',
                'x-amz-crc32',
                '953777335'
            ]);
        let res = await index.dynamoDbQuery();
        expect(res).toEqual(
            {
                Items: [
                    {
                        category: 'mogemoge',
                        key: 'asd',
                        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
                    }
                ],
                Count: 1,
                ScannedCount: 1
            }
        );
    }, 2000);
});
