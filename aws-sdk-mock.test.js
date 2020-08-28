const nock = require("nock");
const index = require("./index.js");
const AWSMock = require("aws-sdk-mock");

AWSMock.mock("DynamoDB.DocumentClient", "put", function(params, callback) {
    callback(null, {});
});

AWSMock.mock("DynamoDB.DocumentClient", "query", function(params, callback) {
    callback(null, 
        {
            Items: [
                {
                    category: 'mogemoge',
                    key: 'asd',
                    createdAt: new Date().toISOString(),
                }
            ],
            Count: 1,
            ScannedCount: 1
        }
    );
});

describe("index", () => {
    beforeAll(() => {
        nock.disableNetConnect();
    });

    afterAll(() => {
        nock.enableNetConnect();
    });

    beforeEach(() => {
        nock.cleanAll();
    });

    test("dynamoDbPut", async () => {
        let res = await index.dynamoDbPut();
        expect(res).toEqual({});
    });

    test("dynamoDbQuery", async () => {
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
    });
});
