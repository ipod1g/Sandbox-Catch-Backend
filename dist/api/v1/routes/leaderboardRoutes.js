"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaderboardController_1 = require("../controllers/leaderboardController");
const leaderboardRoutes = (0, express_1.Router)();
/**
 * GET /api/v1/leaderboard
 * @summary Retrieve a range of leaderboard entries
 * @tags Leaderboard
 * @param {number} range.query.optional - The range of leaderboard entries to retrieve
 * @return {array} 200 - An array of leaderboard entries
 * @return {object} 404 - Player not found response - application/json
 * @return {object} 500 - Unexpected error response - application/json
 * @example response - 200 - Success response example
 * [
 *   {
 *     "playerName": "John",
 *     "score": 100
 *   },
 *   {
 *     "playerName": "Alice",
 *     "score": 90
 *   }
 * ]
 * @example response - 404 - Not found response example
 * {
 *   "error": "Player with ID '123' not found."
 * }
 * @example response - 500 - Unexpected error response example
 * {
 *   "error": "Internal Server Error."
 * }
 */
/**
 * POST /api/v1/leaderboard
 * @summary Insert a user into the leaderboard and return with the id
 * @tags Leaderboard
 * @param {object} request.body.required - The request body containing the score and player information
 * @return {object} 201 - Success response - application/json
 * @return {object} 400 - Bad request response - application/json
 * @return {object} 500 - Unexpected error response - application/json
 * @example request - application/json
 * {
 *   "score": 200,
 *   "player": "Player 1"
 * }
 * @example response - 201 - Success response example
 * {
 *   "id": 1,
 *   "score": 200,
 *   "player": "Player 1"
 * }
 * @example response - 400 - Bad request response example
 * {
 *   "error": "Invalid score. Score must be a number."
 * }
 * @example response - 500 - Unexpected error response example
 * {
 *   "error": "Internal Server Error."
 * }
 */
leaderboardRoutes.get("/", leaderboardController_1.getLeaderBoard).post("/", leaderboardController_1.insertToLeaderboard);
/**
 * GET /api/v1/leaderboard/rank/{id}
 * @summary Retrieve the rank of a player
 * @tags Leaderboard
 * @param {string} id.path.required - The ID of the player
 * @return {object} 200 - Success response - application/json
 * @return {object} 404 - Player not found response - application/json
 * @return {object} 400 - Bad request response - application/json
 * @return {object} 500 - Unexpected error response - application/json
 * @example response - 200 - Success response example
 * {
 *   "rank": 1,
 * }
 * @example response - 404 - Not found response example
 * {
 *   "error": "Player with ID '123' not found."
 * }
 * @example response - 400 - Bad request response example
 * {
 *   "error": "Player ID required"
 * }
 * @example response - 500 - Unexpected error response example
 * {
 *   "error": "Internal Server Error."
 * }
 */
leaderboardRoutes.get("/rank/:id", leaderboardController_1.getPlayer);
exports.default = leaderboardRoutes;
//# sourceMappingURL=leaderboardRoutes.js.map