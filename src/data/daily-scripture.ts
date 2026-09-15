import { amituojingLearningDays } from "@/data/amituojing-learning-path";
import { fahuajingReadingGates } from "@/data/fahuajing-reading-path";

export type DailyScriptureSeriesId =
  | "fundamentals"
  | "heart"
  | "diamond"
  | "dhammapada"
  | "pure-land"
  | "lotus";

export type DailyScripturePassage = {
  id: string;
  series: DailyScriptureSeriesId;
  collection: string;
  workTitle: string;
  witness: string;
  lang: "zh-Hant";
  quote: string;
  locator: string;
  sourceHref: string;
  studyHref: string;
  studyLabel: string;
  quietPrompt: string;
  context: string;
  verification: string;
};

export const dailyScriptureSeries = [
  {
    id: "fundamentals",
    number: "01",
    label: "先立路标",
    title: "从苦、道路与条件关系开始",
    description: "五段阿含与经集原文，把四圣谛、八正道、缘起、无常与无我放回可核对的经句。",
  },
  {
    id: "heart",
    number: "02",
    label: "般若短读",
    title: "《心经》两段",
    description: "先看观照怎样发生，再读色与空；短并不等于可以脱离上下文。",
  },
  {
    id: "diamond",
    number: "03",
    label: "般若核读",
    title: "《金刚经》七段",
    description: "从发问、愿行与布施，读到筏喻、无住生心和如是观。",
  },
  {
    id: "dhammapada",
    number: "04",
    label: "法句观心",
    title: "《法句经》两偈",
    description: "把心念、语言、行动与后果放在一组相反相成的汉译偈颂中观察。",
  },
  {
    id: "pure-land",
    number: "05",
    label: "净土七日",
    title: "《阿弥陀经》七段",
    description: "从正在说法、闻声念三宝与发愿，读到持名、难信和双译边界。",
  },
  {
    id: "lotus",
    number: "06",
    label: "法华七关",
    title: "《法华经》七段",
    description: "用七处转折进入二十八品，不把长经压缩成七句摘要。",
  },
] as const satisfies ReadonlyArray<{
  id: DailyScriptureSeriesId;
  number: string;
  label: string;
  title: string;
  description: string;
}>;

const coreDailyScripturePassages = [
  {
    id: "xinjing-zhaojian",
    series: "heart",
    collection: "般若部 · 观照",
    workTitle: "《般若波罗蜜多心经》",
    witness: "唐·玄奘译 · 大正藏 T0251",
    lang: "zh-Hant",
    quote: "觀自在菩薩行深般若波羅蜜多時，照見五蘊皆空，度一切苦厄。",
    locator: "T0251.001.0848c06–07",
    sourceHref: "/jingzang/xinjing/001-0848c#T0251.001.0848c06",
    studyHref: "/xue/xinjing#day-1",
    studyLabel: "从《心经》第一天继续",
    quietPrompt: "先不解释“空”。只留意此刻的身体、感受与念头：它们是否一直停在原处？",
    context: "经文先写正在发生的观照，再写离苦；“五蕴”指色、受、想、行、识。这里的提示只帮助进入句子，不代替传统注疏。",
    verification: "引文逐字取自玄奘译 T0251 第 848 页下栏第 6–7 行；链接直达首行。平台提示没有进入引文。",
  },
  {
    id: "xinjing-sekong",
    series: "heart",
    collection: "般若部 · 色与空",
    workTitle: "《般若波罗蜜多心经》",
    witness: "唐·玄奘译 · 大正藏 T0251",
    lang: "zh-Hant",
    quote: "色不異空，空不異色，色即是空，空即是色；受、想、行、識，亦復如是。",
    locator: "T0251.001.0848c07–09",
    sourceHref: "/jingzang/xinjing/001-0848c#T0251.001.0848c07",
    studyHref: "/xue/xinjing#day-2",
    studyLabel: "沿《心经》七日路径继续",
    quietPrompt: "看一件眼前的物品：它依靠哪些材料、关系和条件，才在此刻呈现？",
    context: "这一段没有把“色”与“空”分成两个互相排斥的世界。入门时可先从“经验依条件而显现”读起，避免把“空”误读成虚无。",
    verification: "引文跨 T0251 第 848 页下栏第 7–9 行，保留繁体底本文字；句首“舍利子”未纳入本次节选，打开原典可见完整上下文。",
  },
  {
    id: "jingangjing-question",
    series: "diamond",
    collection: "般若部 · 发问",
    workTitle: "《金刚般若波罗蜜经》",
    witness: "后秦·鸠摩罗什译 · 大正藏 T0235",
    lang: "zh-Hant",
    quote: "善男子、善女人，發阿耨多羅三藐三菩提心，應云何住？云何降伏其心？",
    locator: "T0235.001.0748c27–29",
    sourceHref: "/jingzang/jingangjing/001-0748c#T0235.001.0748c27",
    studyHref: "/xue/jingangjing#day-1",
    studyLabel: "从《金刚经》第一问继续",
    quietPrompt: "写下此刻最牵动心的一件事。先不判断它，只看心正在抓住什么。",
    context: "《金刚经》从已经发心的人如何安住、如何面对攀缘发问。先保留问题，再读后文怎样一次次回应，比抢先定义“无住”更接近文本。",
    verification: "引文取自 T0235 第 748 页下栏第 27–29 行；首行前半仍属叙事语境，链接因此落在第 27 行，阅读时宜同时向上、向下核对。",
  },
  {
    id: "jingangjing-no-four-marks",
    series: "diamond",
    collection: "般若部 · 愿行",
    workTitle: "《金刚般若波罗蜜经》",
    witness: "后秦·鸠摩罗什译 · 大正藏 T0235",
    lang: "zh-Hant",
    quote: "如是滅度無量、無數、無邊眾生，實無眾生得滅度者。何以故？須菩提！若菩薩有我相、人相、眾生相、壽者相，即非菩薩。",
    locator: "T0235.001.0749a09–11",
    sourceHref: "/jingzang/jingangjing/001-0749a#T0235.001.0749a09",
    studyHref: "/xue/jingangjing#day-2",
    studyLabel: "继续核读“无四相”",
    quietPrompt: "回想一次帮助他人的经验：若不急着确认“是我帮助了谁”，行动会有什么不同？",
    context: "这段把广大愿行与“不把行动者、对象和成果固定为我所有”放在一起。行动没有被取消，占有式的身份却受到检视。",
    verification: "引文逐字取自 T0235 第 749 页上栏第 9–11 行；“四相”的解释传统很多，此处只呈现段内措辞，不替注疏作统一裁决。",
  },
  {
    id: "jingangjing-giving",
    series: "diamond",
    collection: "般若部 · 布施",
    workTitle: "《金刚般若波罗蜜经》",
    witness: "后秦·鸠摩罗什译 · 大正藏 T0235",
    lang: "zh-Hant",
    quote: "復次，須菩提！菩薩於法應無所住行於布施，所謂不住色布施，不住聲、香、味、觸、法布施。須菩提！菩薩應如是布施，不住於相。",
    locator: "T0235.001.0749a12–14",
    sourceHref: "/jingzang/jingangjing/001-0749a#T0235.001.0749a12",
    studyHref: "/xue/jingangjing#day-3",
    studyLabel: "继续读“不住相布施”",
    quietPrompt: "今天做一件不求被看见的小事。做完后，观察心是否仍在等待回报或肯定。",
    context: "“不住”在这里出现在布施这一行动中，不是退回什么都不做。经文保留行动，同时检视对感官对象、评价和自我形象的依附。",
    verification: "引文逐字取自 T0235 第 749 页上栏第 12–14 行，并在“何以故”之前收束；福德语境在下一行继续。",
  },
  {
    id: "jingangjing-marks",
    series: "diamond",
    collection: "般若部 · 见相",
    workTitle: "《金刚般若波罗蜜经》",
    witness: "后秦·鸠摩罗什译 · 大正藏 T0235",
    lang: "zh-Hant",
    quote: "凡所有相，皆是虛妄；若見諸相非相，則見如來。",
    locator: "T0235.001.0749a24–25",
    sourceHref: "/jingzang/jingangjing/001-0749a#T0235.001.0749a24",
    studyHref: "/xue/jingangjing#day-4",
    studyLabel: "继续核读“诸相非相”",
    quietPrompt: "看一个你已下定论的人或事：是否把一个暂时呈现的“相”当成了全部？",
    context: "“非相”不必先被读成否定眼前一切。可先注意经文的辨析：相会呈现，却不应被当成固定、独立、足以代表全部实相的东西。",
    verification: "这是 T0235 第 749 页上栏第 24–25 行的完整两行名句；不同汉译的措辞和句界须分别核对，本站不自动逐词等同。",
  },
  {
    id: "jingangjing-raft",
    series: "diamond",
    collection: "般若部 · 筏喻",
    workTitle: "《金刚般若波罗蜜经》",
    witness: "后秦·鸠摩罗什译 · 大正藏 T0235",
    lang: "zh-Hant",
    quote: "如來常說：『汝等比丘，知我說法，如筏喻者，法尚應捨，何況非法。』",
    locator: "T0235.001.0749b10–11",
    sourceHref: "/jingzang/jingangjing/001-0749b#T0235.001.0749b10",
    studyHref: "/xue/jingangjing#day-5",
    studyLabel: "继续读《金刚经》筏喻",
    quietPrompt: "想起一个曾帮助过你的方法：它仍在服务当下，还是已变成必须维护的标签？",
    context: "筏是渡越的工具，不是抵达后仍须背负的身份。这不是说学习与实践无用，而是提醒人也可能占有、标榜或固化有效的方法。",
    verification: "引文取自 T0235 第 749 页中栏第 10–11 行；本卡不据此推出“什么都该舍”的泛化结论，前文仍需一并阅读。",
  },
  {
    id: "jingangjing-no-abiding",
    series: "diamond",
    collection: "般若部 · 生心",
    workTitle: "《金刚般若波罗蜜经》",
    witness: "后秦·鸠摩罗什译 · 大正藏 T0235",
    lang: "zh-Hant",
    quote: "菩薩摩訶薩應如是生清淨心，不應住色生心，不應住聲、香、味、觸、法生心，應無所住而生其心。",
    locator: "T0235.001.0749c21–23",
    sourceHref: "/jingzang/jingangjing/001-0749c#T0235.001.0749c21",
    studyHref: "/xue/jingangjing#day-6",
    studyLabel: "继续核读“无住生心”",
    quietPrompt: "为今天真正重要的一件事发心，然后松开对结果必须符合预期的要求。",
    context: "经文把“无所住”与“生其心”写在一起。它没有要求停止发心，而是在发心与行动时，不把心固定在色、声、香、味、触、法上。",
    verification: "引文跨 T0235 第 749 页下栏第 21–23 行，止于下一段譬喻之前；流行短句不能代替完整语法与诸译本核读。",
  },
  {
    id: "jingangjing-dream",
    series: "diamond",
    collection: "般若部 · 如是观",
    workTitle: "《金刚般若波罗蜜经》",
    witness: "后秦·鸠摩罗什译 · 大正藏 T0235",
    lang: "zh-Hant",
    quote: "一切有為法，如夢、幻、泡、影，如露亦如電，應作如是觀。",
    locator: "T0235.001.0752b28–29",
    sourceHref: "/jingzang/jingangjing/001-0752b#T0235.001.0752b28",
    studyHref: "/xue/jingangjing#day-7",
    studyLabel: "走完《金刚经》七日路径",
    quietPrompt: "今天有什么被你看得比昨天稍微松动了一点？只看见它，不急着把它抓成结论。",
    context: "六个譬喻共同指向迅速生灭、依条件显现的经验。它们邀请一种观看，不是抹去发生过的事，也不是否定因果。",
    verification: "偈颂逐字取自 T0235 第 752 页中栏第 28–29 行；前一行保留“不取于相”的演说语境，打开原典时建议向上读一行。",
  },
  {
    id: "fajujing-unwholesome-mind",
    series: "dhammapada",
    collection: "本缘部 · 双要品",
    workTitle: "《法句经》",
    witness: "吴·维祇难等译 · 大正藏 T0210",
    lang: "zh-Hant",
    quote: "心為法本，心尊心使，中心念惡，即言即行，罪苦自追，車轢于轍；",
    locator: "T0210.001.0562a13–14",
    sourceHref: "/jingzang/fajujing/001-0562a#T0210.001.0562a13",
    studyHref: "/xue/faju",
    studyLabel: "并读汉译、巴利与历史英译",
    quietPrompt: "回看今天一次言语或行动：在它发生之前，心里最先出现了什么方向？",
    context: "这组偈先把心念、言行与苦的后果连成一条链。它适合帮助辨认反应方向，却不能把疾病、创伤或社会处境简化成“只是心态”。",
    verification: "引文逐字取自 T0210 第 562 页上栏第 13–14 行；《法句经》汉译与巴利 Dhammapada 可并读，但不是同一份数字文本。",
  },
  {
    id: "fajujing-wholesome-mind",
    series: "dhammapada",
    collection: "本缘部 · 双要品",
    workTitle: "《法句经》",
    witness: "吴·维祇难等译 · 大正藏 T0210",
    lang: "zh-Hant",
    quote: "心為法本，心尊心使，中心念善，即言即行，福樂自追，如影隨形。",
    locator: "T0210.001.0562a15–16",
    sourceHref: "/jingzang/fajujing/001-0562a#T0210.001.0562a15",
    studyHref: "/xue/faju",
    studyLabel: "打开《法句》三源研读档案",
    quietPrompt: "今天准备说下一句话前，先停一下：它会把自己和他人带向更少伤害的方向吗？",
    context: "这一偈与前一偈成对出现：观察心不只是发现恶念，也包括辨认善念怎样进入言语、行动与后续经验。",
    verification: "引文逐字取自 T0210 第 562 页上栏第 15–16 行；“福乐”是本汉译的措辞，跨语言比较须回到各自版本。",
  },
] as const satisfies readonly DailyScripturePassage[];

const foundationalPassages = [
  {
    id: "sidi-four-tasks",
    series: "fundamentals",
    collection: "阿含部 · 四圣谛",
    workTitle: "《杂阿含经》",
    witness: "刘宋·求那跋陀罗译 · 大正藏 T0099",
    lang: "zh-Hant",
    quote: "若比丘於苦聖諦當知、當解，於苦集聖諦當知、當斷，於苦滅聖諦當知、當證，於苦滅道跡聖諦當知、當修。",
    locator: "T0099.015.0104b16–18",
    sourceHref: "/jingzang/zaahanjing/015-0104b#T0099.015.0104b16",
    studyHref: "/gainian/sidi",
    studyLabel: "进入四圣谛证据页",
    quietPrompt: "把眼前一件苦分成四问：事实是什么、什么令它续起、何谓止息、下一步能修什么？",
    context: "同一段没有停在“有苦”：苦要知解，集要断，灭要证，道要修。四项动作不能被缩成一句悲观判断。",
    verification: "引文逐字取自 T0099 第 104 页中栏第 16–18 行；页面另以巴利 SN 56.11 作相关结构并读，不宣称已完成严格平行经认定。",
  },
  {
    id: "bazhengdao-one-road",
    series: "fundamentals",
    collection: "阿含部 · 八正道",
    workTitle: "《杂阿含经》",
    witness: "刘宋·求那跋陀罗译 · 大正藏 T0099",
    lang: "zh-Hant",
    quote: "有八正道，能斷愛欲，謂正見、正志、正語、正業、正命、正方便、正念、正定。",
    locator: "T0099.028.0199a10–11",
    sourceHref: "/jingzang/zaahanjing/028-0199a#T0099.028.0199a10",
    studyHref: "/gainian/bazhengdao",
    studyLabel: "进入八正道证据页",
    quietPrompt: "选一件今天正在做的事，观察见解、意向、言语、行动与觉察是否正把它带向更少的执取。",
    context: "经文先问有没有道路能断爱欲，再完整列出八支。它们同属一条道路，不是八个互不相干的打卡项目。",
    verification: "引文逐字取自 T0099 第 199 页上栏第 10–11 行；“正志”“正方便”等古译保留原貌，不用现代熟词覆盖底本。",
  },
  {
    id: "yuanqi-arising-ceasing",
    series: "fundamentals",
    collection: "阿含部 · 缘起",
    workTitle: "《杂阿含经》",
    witness: "刘宋·求那跋陀罗译 · 大正藏 T0099",
    lang: "zh-Hant",
    quote: "此有故彼有，此生故彼生，謂緣無明有行，乃至生、老、病、死、憂、悲、惱、苦集；所謂此無故彼無，此滅故彼滅，謂無明滅則行滅，乃至生、老、病、死、憂、悲、惱、苦滅。",
    locator: "T0099.010.0067a05–08",
    sourceHref: "/jingzang/zaahanjing/010-0067a#T0099.010.0067a05",
    studyHref: "/gainian/yuanqi",
    studyLabel: "进入缘起证据页",
    quietPrompt: "观察一个正在发生的反应：它依靠哪些条件维持？若少一个条件，反应会不会改变？",
    context: "生起与止息在同一段中出现。缘起因此不是宿命式的单向决定，而是让条件与可停止之处同时变得可见。",
    verification: "引文逐字取自 T0099 第 67 页上栏第 5–8 行；同段并列条件生起与条件止息，不把省略号后的次第冒充另一段原文。",
  },
  {
    id: "wuchang-turning-point",
    series: "fundamentals",
    collection: "经集部 · 无常",
    workTitle: "《佛说无常经》",
    witness: "唐·义净译 · 大正藏 T0801",
    lang: "zh-Hant",
    quote: "是故勸諸人，諦聽真實法，共捨無常處，當行不死門。佛法如甘露，除熱得清涼，一心應善聽，能滅諸煩惱。",
    locator: "T0801.001.0745c11–14",
    sourceHref: "/jingzang/taisho-t0801/001-0745c#T0801.001.0745c11",
    studyHref: "/gainian/wuchang",
    studyLabel: "进入无常证据页",
    quietPrompt: "承认一件正在变化的事，再问：看见变化之后，今天能选择哪一个更少烦恼的方向？",
    context: "这组偈没有让读者停在衰败与死亡；看见无常之后，经文立即转向听法、离苦与灭烦恼。",
    verification: "引文逐字取自 T0801 第 745 页下栏第 11–14 行；本卡不把经中后续临终劝导与仪轨推广成所有传统的共同做法。",
  },
  {
    id: "wuwo-not-owned",
    series: "fundamentals",
    collection: "阿含部 · 无我",
    workTitle: "《佛说五蕴皆空经》",
    witness: "唐·义净译 · 大正藏 T0102",
    lang: "zh-Hant",
    quote: "凡所有色，若過去未來現在，內外麁細，若勝若劣、若遠若近，悉皆無我。",
    locator: "T0102.001.0499c18–20",
    sourceHref: "/jingzang/taisho-t0102/001-0499c#T0102.001.0499c18",
    studyHref: "/gainian/wuwo",
    studyLabel: "进入无我证据页",
    quietPrompt: "留意一种被称为“我的”身体感受：它能否完全按自己的意愿停留、消失或改变？",
    context: "这一段把过去、未来、现在与内外粗细等范围逐一展开，再说“悉皆无我”；它检视的是执取，不是否认经验发生。",
    verification: "引文逐字取自 T0102 第 499 页下栏第 18–20 行；原段随后继续观察受、想、行、识及“我所”。",
  },
] as const satisfies readonly DailyScripturePassage[];

const amituojingPassages = amituojingLearningDays.map((day) => ({
  id: `amituojing-day-${day.id}`,
  series: "pure-land" as const,
  collection: `净土部 · ${day.focus}`,
  workTitle: "《佛说阿弥陀经》",
  witness: "姚秦·鸠摩罗什译 · 大正藏 T0366",
  lang: "zh-Hant" as const,
  quote: day.reading,
  locator: day.locator,
  sourceHref: day.href,
  studyHref: `/xue/amituojing#day-${day.id}`,
  studyLabel: `继续《阿弥陀经》第 ${day.id} 日`,
  quietPrompt: day.practice,
  context: day.context,
  verification: `引文逐字取自 ${day.locator}；${day.versionNote}`,
})) satisfies readonly DailyScripturePassage[];

const fahuajingPassages = fahuajingReadingGates.map((gate) => ({
  id: `fahuajing-gate-${gate.id}`,
  series: "lotus" as const,
  collection: `法华部 · ${gate.chapterTitle}`,
  workTitle: "《妙法莲华经》",
  witness: "姚秦·鸠摩罗什译 · 大正藏 T0262",
  lang: "zh-Hant" as const,
  quote: gate.reading,
  locator: gate.locator,
  sourceHref: gate.href,
  studyHref: `/xue/fahuajing#day-${gate.id}`,
  studyLabel: `继续《法华经》第 ${gate.id} 关`,
  quietPrompt: gate.pause,
  context: gate.hint,
  verification: `引文逐字取自 ${gate.locator}；${gate.researchCue}`,
})) satisfies readonly DailyScripturePassage[];

export const dailyScripturePassages = [
  ...foundationalPassages,
  ...coreDailyScripturePassages,
  ...amituojingPassages,
  ...fahuajingPassages,
] as const satisfies readonly DailyScripturePassage[];

if (dailyScripturePassages.length !== 30) {
  throw new Error("三十段原典的受控清单必须保持为 30 段");
}
