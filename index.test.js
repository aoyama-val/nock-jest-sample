const nock = require("nock");
const index = require("./index.js");

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
        expect(scope.isDone()).toEqual(true);
    });
});
