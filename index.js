const http = require("http");
const https = require("https");

/**
 * 指定したサーバーにHTTP/HTTPSリクエストを送信し、レスポンスを返す。
 * リダイレクトには未対応。
 * https://nodejs.org/docs/latest-v12.x/api/http.html#http_http_request_url_options_callback
 *
 * @param {String} url https.requestのurlと同じ
 * @param {Object} options https.requestのoptionsと同じ
 * @param {String|any} postData リクエストボディ（文字列でない場合は自動的にJSON.stringifyされる）
 */ 
exports.httpsRequest = function(url, _options, postData) {
    const HTTP_TIMEOUT = 30000;

    let urlObject = new URL(url);
    let options = {};
    options.protocol = urlObject.protocol;
    options.hostname = urlObject.hostname;
    options.port = urlObject.port;
    options.path = urlObject.pathname + urlObject.search;
    options = Object.assign(options, _options);

    console.log("[HTTPS Request] url:", url);
    console.log("[HTTPS Request] options:", JSON.stringify(options, null, 2));
    if (postData != undefined) {
        console.log("[HTTPS Request] postData:", postData);
    }
    let started = new Date();
    return new Promise((resolve, reject) => {
        // デフォルトはHTTPS。optionsにprotocol: 'http:'を含めればHTTPになる（その場合のポートはデフォルト80）。
        let httpModule = options.protocol == "http:" ? http : https;

        let req = httpModule.request(url, JSON.parse(JSON.stringify(options)), function (res) {
            res.setEncoding("utf8");    // レスポンスの文字コードはUTF-8前提
            let body = "";
            res.on("data", function (chunk) {
                body += chunk;
            });
            res.on("end", function () {
                // 2xxでない場合はログを残しつつ、レスポンスは普通に返す
                if (!(200 <= res.statusCode && res.statusCode < 300)) {
                    console.log("[HTTPS Request] Error res.statusCode:", res.statusCode, res.statusMessage);
                    console.log("[HTTPS Request] Error res.headers:", res.headers);
                    console.log("[HTTPS Request] Error body:", body);
                }
                console.log("[HTTPS Request] Elapsed time: " + (new Date() - started) + " ms for " + url);
                resolve({
                    statusCode: res.statusCode, // 整数
                    headers: res.headers,   // Object。キーが全て小文字になっていることに注意。https://nodejs.org/docs/latest-v12.x/api/http.html#http_message_headers
                    body: body, // 文字列のまま（JSON.parseはしない）
                });
            });
        });

        // タイムアウト設定
        req.setTimeout(HTTP_TIMEOUT);
        req.on("timeout", function () {
            console.log("[HTTPS Request] request timed out");
            req.abort();
            reject("request timed out");    // タイムアウトの場合は例外を投げる
        });
        req.on("error", function (err) {
            console.log("[HTTPS Request] Error: " + err.code + ", " + err.message);
            reject(err);    // ネットワークエラーの場合は例外を投げる
        });
        if (postData !== undefined) {
            // リクエストボディをセット
            if (typeof(postData) == "string") {
                req.write(postData);
            } else {
                req.write(JSON.stringify(postData));
            }
        }
        req.end();
    });
};

//async function main() {
//    let res = await exports.httpsRequest("https://httpbin.org/get");
//    return res;
//}
//
//exports.main = main;
