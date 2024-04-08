"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const v1_1 = __importDefault(require("./api/v1"));
const app = (0, express_1.default)();
const port = process.env.PORT || "8000";
app.use((0, cors_1.default)());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.use(helmet_1.default.contentSecurityPolicy({
    directives: {
        "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
    },
}));
// rate limiter: maximum of twenty requests per minute
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20,
});
// To all requests
app.use(limiter);
app.use("/api/v1", v1_1.default);
app.use((err, req, res, next) => {
    console.error("An error occurred:", err);
    res.status(500).json({ error: "Internal Server Error" });
});
app.listen(port, () => {
    return console.log(`Server is listening on ${port}`);
});
//# sourceMappingURL=index.js.map