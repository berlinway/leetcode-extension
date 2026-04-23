/*
 * https://github.com/ccagml/leetcode-extension/src/rpc/factory/api/queryApi.ts
 * Path: https://github.com/ccagml/leetcode-extension
 * Created Date: Thursday, November 17th 2022, 11:44:14 am
 * Author: ccagml
 *
 * Copyright (c) 2022 ccagml . All rights reserved.
 */

import { reply } from "../../utils/ReplyUtils";
import { sessionUtils } from "../../utils/sessionUtils";
import { ApiBase } from "../apiBase";

import { chainMgr } from "../../actionChain/chainManager";
import { configUtils } from "../../utils/configUtils";

class QueryApi extends ApiBase {
  constructor() {
    super();
  }

  private outputError(e: any, code: number = -1) {
    const msg = e?.msg || e?.message || e?.toString?.() || "unknown error";
    reply.info(JSON.stringify({ code, msg }));
  }

  callArg(argv) {
    let argv_config = this.api_argv()
      .option("T", {
        alias: "dontTranslate",
        type: "boolean",
        default: false,
        describe: "Set to true to disable endpoint's translation",
      })
      .option("a", {
        alias: "getTodayQuestion",
        type: "boolean",
        default: false,
        describe: "getTodayQuestion",
      })
      .option("b", {
        alias: "username",
        type: "string",
        default: "",
        describe: "user name",
      })
      .option("c", {
        alias: "getRating",
        type: "boolean",
        default: false,
        describe: "ranking",
      })
      .option("d", {
        alias: "getAllProblems",
        type: "boolean",
        default: false,
        describe: "getAllProblems",
      })
      .option("e", {
        alias: "getHelp",
        type: "boolean",
        default: false,
        describe: "getHelp",
      })
      .option("f", {
        alias: "help_cn",
        type: "boolean",
        default: false,
        describe: "getHelp help_cn",
      })
      .option("g", {
        alias: "lang",
        type: "string",
        default: configUtils.code.lang,
        describe: "getHelp Programming language of the source code",
      })
      .option("h", {
        alias: "hints",
        type: "boolean",
        default: false,
        describe: "get Hints Programming language of the source code",
      })
      .option("i", {
        alias: "getRecentContest",
        type: "boolean",
        default: false,
        describe: "getRecentContestList",
      })
      .option("j", {
        alias: "getContestQuestion",
        type: "string",
        default: false,
        describe: "get Question list of a contest",
      })
      .option("z", {
        alias: "test",
        type: "string",
        default: "",
        describe: "test",
      })
      .positional("keyword", {
        type: "string",
        default: "",
        describe: "帮助的参数?",
      });
    argv_config.parseArgFromCmd(argv);
    return argv_config.get_result();
  }

  call(argv) {
    const that = this;
    sessionUtils.argv = argv;
    if (argv.a) {
      chainMgr.getChainHead().getTodayQuestion(function (e, result) {
        if (e) return that.outputError(e, -101);
        reply.info(JSON.stringify(result));
      });
    } else if (argv.b) {
      chainMgr.getChainHead().getUserContest(argv.b, function (e, result) {
        if (e) return that.outputError(e, -102);
        reply.info(JSON.stringify(result));
      });
    } else if (argv.c) {
      chainMgr.getChainHead().getRating(function (e, result) {
        if (e) {
          let log_data = {
            code: 101,
            data: {},
          };
          if (e.code == "ETIMEDOUT") {
            log_data.code = 102;
          }

          reply.info(JSON.stringify(log_data));
          return;
        }
        let log_data = {
          code: 100,
          data: result,
        };
        reply.info(JSON.stringify(log_data));
      });
    } else if (argv.d) {
      chainMgr.getChainHead().filterProblems(argv, function (e, problems) {
        if (e) return that.outputError(e, -103);
        let new_objcet: Array<any> = [];
        problems.forEach((element) => {
          let temp_ele: any = {};
          for (const key in element) {
            if (key != "link") {
              temp_ele[key] = element[key];
            }
          }
          new_objcet.push(temp_ele);
        });
        reply.info(JSON.stringify(new_objcet));
      });
    } else if (argv.e) {
      if (argv.keyword.length > 0) {
        // show specific one
        chainMgr.getChainHead().getProblem(argv.keyword, !argv.dontTranslate, function (e, problem) {
          if (e) return that.outputError(e, -104);
          chainMgr.getChainHead().getHelpOnline(problem, argv.f, argv.g);
        });
      }
    } else if (argv.h) {
      if (argv.keyword.length > 0) {
        // show specific one
        chainMgr.getChainHead().getProblem(argv.keyword, !argv.dontTranslate, function (e, problem) {
          if (e) return that.outputError(e, -105);
          chainMgr.getChainHead().getHintsOnline(problem, function (e, result) {
            if (e) return that.outputError(e, -106);
            reply.info(JSON.stringify({ code: 100, hints: result }));
          });
        });
      }
    } if (argv.i) {
      chainMgr.getChainHead().getRecentContest(function (e, result) {
        if (e) return that.outputError(e, -107);
        reply.info(JSON.stringify(result));
      });
    } if (argv.j) {
      chainMgr.getChainHead().getContestQuestion(argv.j, function (e, result) {
        if (e) return that.outputError(e, -108);
        reply.info(JSON.stringify(result));
      });
    } else if (argv.z) {
      chainMgr.getChainHead().getQueryZ(argv.z, function (e, result) {
        if (e) return that.outputError(e, -109);
        reply.info(JSON.stringify(result));
      });
    }
  }
}

export const queryApi: QueryApi = new QueryApi();
