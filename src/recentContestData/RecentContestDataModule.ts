import { BABAMediator, BABAProxy, BabaStr, BaseCC, BABA } from "../BABA";
import { OutPutType } from "../model/ConstDefind";
import { IContestData, ITreeDataNormal } from "../model/TreeNodeModel";
import { isUseEndpointTranslation } from "../utils/ConfigUtils";
import { promptForSignIn, ShowMessage } from "../utils/OutputUtils";

class RecentContestData {
  slugInfo: Map<number, IContestData> = new Map<number, IContestData>();

  setSlugInfo(data) {
    this.slugInfo.set(data.titleSlug, data);
  }

  getSlugInfo(slug) {
    return this.slugInfo.get(slug);
  }
}

const recentContestData: RecentContestData = new RecentContestData();

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

export class RecentContestProxy extends BABAProxy {
  static NAME = BabaStr.RecentContestProxy;
  constructor() {
    super(RecentContestProxy.NAME);
  }

  public getAllRecentContestData() {
    return recentContestData.slugInfo;
  }

  public getRecentContestData(slug) {
    return recentContestData.getSlugInfo(slug);
  }

  public getAllContestTreeNode(): ITreeDataNormal[] {
    let contestData: ITreeDataNormal[] = [];
    this.getAllRecentContestData().forEach((value) => {
      let data: ITreeDataNormal = {
        id: value.titleSlug,
        name: value.title,
        rootNodeSortId: value.startTime,
      };
      contestData.push(data);
    });
    return contestData;
  }

  public async searchRecentContest(): Promise<void> {
    let sbp = BABA.getProxy(BabaStr.StatusBarProxy);
    if (!sbp.getUser()) {
      promptForSignIn();
      return;
    }
    try {
      const needTranslation: boolean = isUseEndpointTranslation();
      const solution: string = await BABA.getProxy(BabaStr.ChildCallProxy)
        .get_instance()
        .getRecentContest(needTranslation);
      const query_result = JSON.parse(solution);
      // "{\"titleSlug\":\"number-of-dice-rolls-with-target-sum\",\"questionId\":\"1263\",\"fid\":\"1155\",\"userStatus\":\"NOT_START\"}\n"

      // const titleSlug: string = query_result.titleSlug
      // const questionId: string = query_result.questionId
      const contestLen = query_result.contests.length;
      for (let i = 0; i < contestLen; i++) {
        const contest = query_result.contests[i];
        if (this.getRecentContestData(contest.titleSlug)) {
          continue;
        }
        let data: any = {};
        data.index = i;
        data.titleSlug = contest.titleSlug;
        data.title = contest.title;
        data.startTime = contest.startTime;
        data.duration = contest.duration;
        recentContestData.setSlugInfo(data);
      }
      if (contestLen > 0) {
        BABA.sendNotification(BabaStr.TreeData_searchRecentContestFinish);
      }
    } catch (error) {
      BABA.getProxy(BabaStr.LogOutputProxy).get_log().appendLine(formatError(error));
      await ShowMessage("Failed to fetch recent contest list. 请查看控制台信息~", OutPutType.error);
    }
  }

}

export class RecentContestMediator extends BABAMediator {
  static NAME = BabaStr.RecentContestMediator;
  constructor() {
    super(RecentContestMediator.NAME);
  }

  listNotificationInterests(): string[] {
    return [
      BabaStr.VSCODE_DISPOST,
      BabaStr.StartReadData,
      BabaStr.BABACMD_refresh,
      // BabaStr.every_minute,
    ];
  }
  async handleNotification(_notification: BaseCC.BaseCC.INotification) {
    switch (_notification.getName()) {
      case BabaStr.VSCODE_DISPOST:
        break;
      case BabaStr.StartReadData:
        // await BABA.getProxy(BabaStr.RecentContestProxy).searchRecentContest();
        break;
      case BabaStr.BABACMD_refresh:
        // BABA.getProxy(BabaStr.RecentContestProxy).searchRecentContest();
        break;
      // case BabaStr.every_minute:
      //   await todayData.checkNeedReadNew();
      //   break;
      default:
        break;
    }
  }
}
