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
});
