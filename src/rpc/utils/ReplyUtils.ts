/*
 * https://github.com/ccagml/leetcode-extension/src/rpc/Response.ts
 * Path: https://github.com/ccagml/leetcode-extension
 * Created Date: Monday, November 14th 2022, 4:04:31 pm
 * Author: ccagml
 *
 * Copyright (c) 2022 ccagml . All rights reserved.
 */

let _ = require("underscore");

class Reply {
  init_recv_flag = false;
  output = _.bind(console.log, console);
  level: any;
  levels = new Map([
    ["INFO", { value: 2 }],
    ["WARN", { value: 3 }],
    ["ERROR", { value: 4 }],
  ]);

  operCookie = 0;

  operWaitMap: Map<number, any> = new Map<number, any>();

  setLevel(name: any) {
    this.level = this.levels.get(name) || this.levels.get("INFO");
  }

  fail(e: any) {
    let msg = e.msg || e;
    if (e.statusCode) {
      msg += " [code=" + e.statusCode + "]";
    }
    this.error(msg);
  }

  fatal(e: any) {
    this.error(e);
    process.exit(1);
  }

  init() {
    this.setLevel("INFO");
  }

  private formatArg(value: any): string {
    if (value === undefined) {
      return "undefined";
    }
    if (value === null) {
      return "null";
    }
    if (typeof value === "string") {
      return value;
    }
    if (Buffer.isBuffer(value)) {
      return value.toString();
    }
    if (value instanceof Error) {
      return value.stack || value.message || value.toString();
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (_) {
        return value.toString();
      }
    }
    return value.toString();
  }

  info(...rest: any[]) {
    const args = rest; //Array.from(arguments);
    let s = args.map((x) => this.formatArg(x)).join(" ");
    this.output(s);
  }
  warn(...rest: any[]) {
    const args = rest; //Array.from(arguments);
    args.unshift("[" + "warn" + "]");

    let s = args.map((x) => this.formatArg(x)).join(" ");
    this.output(s);
  }
  error(...rest: any[]) {
    const args = rest; //Array.from(arguments);
    args.unshift("[" + "error" + "]");

    let s = args.map((x) => this.formatArg(x)).join(" ");
    this.output(s);
  }

  initRecv() {
    // 监听父进程的输入
    this.init_recv_flag = true;
    process.stdin.on("data", (data) => {
      reply.recvCallback(data.toString());
    });
  }

  recvCallback(data) {
    let data_ob;
    try {
      data_ob = JSON.parse(data);
    } catch (e) {
      this.error("recvCallback parse error", e);
      return;
    }
    let c = data_ob.c;
    let need_call = this.operWaitMap.get(c);
    if (need_call) {
      need_call.callback(need_call.arg, data_ob);
    }
  }

  getOperCookie() {
    this.operCookie = this.operCookie + 1;
    return this.operCookie;
  }

  remote_post(oper_data, cb) {
    if (!this.init_recv_flag) {
      this.initRecv();
    }
    let c = this.getOperCookie();
    this.operWaitMap.set(c, { arg: oper_data, callback: cb });

    let msg = { oper: "requireOper", cookie: c, arg: oper_data };
    this.output(JSON.stringify(msg));
  }
}

export const reply: Reply = new Reply();
