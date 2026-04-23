import { BABAMediator, BABAProxy, BabaStr, BaseCC, BABA } from "../BABA";
import { OutPutType } from "../model/ConstDefind";
import { promptForSignIn, ShowMessage } from "../utils/OutputUtils";

class ContestQuestionData {
  fidInfo: Map<string, number[]> = new Map<string, number[]>();

  setFidInfo(fid, data) {
    this.fidInfo.set(fid, data);
  }

  getFidInfo(fid) {
    return this.fidInfo.get(fid);
  }
}

const contestQuestionData: ContestQuestionData = new ContestQuestionData();

function formatError(error: any): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch (_) {
    return String(error);
  }
}

export class ContestQuestionProxy extends BABAProxy {
  static NAME = BabaStr.ContestQuestionProxy;
  constructor() {
    super(ContestQuestionProxy.NAME);
  }

  public getAllRecentContestQuestionData() {
    return contestQuestionData.fidInfo;
  }

  public getContestQuestionData(contestName) {
    return contestQuestionData.getFidInfo(contestName);
  }

  public async searchContestQuestionData(contestName): Promise<void> {
    let sbp = BABA.getProxy(BabaStr.StatusBarProxy);
    if (!sbp.getUser()) {
      promptForSignIn();
      return;
    }
    try {
      const solution: string = await BABA.getProxy(BabaStr.ChildCallProxy)
        .get_instance()
        .getContestQuestion(contestName);
      const query_result = JSON.parse(solution);

      for (let i = 0; i < query_result.length; i++) {
        let data = query_result[i].questions.map((item) => item.question_id);
        contestQuestionData.setFidInfo(query_result[i].contest, data);
      }
      BABA.sendNotification(BabaStr.TreeData_searchContestQuestionFinish);
    } catch (error) {
      BABA.getProxy(BabaStr.LogOutputProxy).get_log().appendLine(formatError(error));
      await ShowMessage("Failed to fetch question of" + contestName + ". 请查看控制台信息~", OutPutType.error);
    }
  }
}

export class ContestQuestionMediator extends BABAMediator {
  static NAME = BabaStr.ContestQuestionMediator;
  constructor() {
    super(ContestQuestionMediator.NAME);
  }

  listNotificationInterests(): string[] {
    return [
      BabaStr.TreeData_searchRecentContestFinish,
    ];
  }
  async handleNotification(_notification: BaseCC.BaseCC.INotification) {
    switch (_notification.getName()) {
      case BabaStr.TreeData_searchRecentContestFinish:
        // let ContestList = BABA.getProxy(BabaStr.RecentContestProxy).getAllRecentContestData();
        // let contestName = Array.from(ContestList.keys()).join(",");
        // await BABA.getProxy(BabaStr.ContestQuestionProxy).searchContestQuestionData(contestName);
        break;
      default:
        break;
    }
  }
}
