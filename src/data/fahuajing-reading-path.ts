export type FahuajingReadingGate = {
  id: number;
  chapter: number;
  chapterTitle: string;
  title: string;
  focus: string;
  reading: string;
  hint: string;
  pause: string;
  researchCue: string;
  segmentId: string;
  locator: string;
  href: string;
  englishHref: string;
};

const fahuajingWorkPath = "/jingzang/fahuajing";
const soothillWorkPath = "/jingzang/gutenberg-en-lotus-soothill";

function sourceHref(folio: string, segmentId: string) {
  return `${fahuajingWorkPath}/${folio}#${segmentId}`;
}

function soothillHref(chapter: number, segmentId: string) {
  return `${soothillWorkPath}/001-c${String(chapter).padStart(2, "0")}#${segmentId}`;
}

export const fahuajingReadingGates: FahuajingReadingGate[] = [
  {
    id: 1,
    chapter: 2,
    chapterTitle: "方便品",
    title: "先问：佛为何出现于世",
    focus: "一大事因缘",
    reading:
      "諸佛世尊唯以一大事因緣故出現於世。舍利弗！云何名諸佛世尊唯以一大事因緣故出現於世？諸佛世尊，欲令眾生開佛知見，使得清淨故，出現於世；欲示眾生佛之知見故，出現於世；欲令眾生悟佛知見故，出現於世；欲令眾生入佛知見道故，出現於世。舍利弗！是為諸佛以一大事因緣故出現於世。",
    hint:
      "经文没有先给一套抽象定义，而是用“开、示、悟、入”四个动作描述佛出世与众生的关系。第一关只观察这个方向：听法者不是被动接收一个结论，而被邀请进入一条逐渐开展的路。",
    pause: "今天先不解释“佛知见”。只写下：我真正想从这部经中看清什么？",
    researchCue:
      "本段位于第二品。四个动词在后世判释中有多种解释；这里仅提示段内结构，不把任何宗派注疏写成经文本身。右侧英译是同品节译见证，不是逐句对齐。",
    segmentId: "T0262.001.0007a21",
    locator: "T0262.001.0007a21–28",
    href: sourceHref("001-0007a", "T0262.001.0007a21"),
    englishHref: soothillHref(2, "GUTENBERG-LOTUS-SOOTHILL-1930.001.s0000002300"),
  },
  {
    id: 2,
    chapter: 3,
    chapterTitle: "譬喻品",
    title: "在火宅中，看见方便",
    focus: "苦与救护",
    reading:
      "三界無安，猶如火宅，眾苦充滿，甚可怖畏。常有生老、病死憂患，如是等火，熾然不息。如來已離，三界火宅，寂然閑居，安處林野。今此三界，皆是我有，其中眾生，悉是吾子。而今此處，多諸患難，唯我一人，能為救護。雖復教詔，而不信受，於諸欲染，貪著深故。",
    hint:
      "火宅譬喻把危险、贪著与救护放在同一个场景。先不要急着判断故事中的方法；看清问题为何不只是“没有听见”，还包括人在欲染中不愿离开。方便由此成为怎样把人带向安全的行动。",
    pause: "辨认一个明知会带来苦、却仍难以离开的习惯。先如实承认，不急着责备自己。",
    researchCue:
      "本段是譬喻中的偈颂，不可脱离长者、诸子与三车的前后叙事单独建立完整教义。建议从原典链接向上阅读本品故事。",
    segmentId: "T0262.002.0014c22",
    locator: "T0262.002.0014c22–29",
    href: sourceHref("002-0014c", "T0262.002.0014c22"),
    englishHref: soothillHref(3, "GUTENBERG-LOTUS-SOOTHILL-1930.001.s0000006300"),
  },
  {
    id: 3,
    chapter: 5,
    chapterTitle: "药草喻品",
    title: "一场雨，不抹平草木",
    focus: "一味随分",
    reading:
      "其雲所出，一味之水，草木叢林，隨分受潤。一切諸樹，上中下等，稱其大小，各得生長，根莖枝葉，華菓光色，一雨所及，皆得鮮澤。如其體相，性分大小，所潤是一，而各滋茂。",
    hint:
      "同一场雨落下，草木却依各自条件生长。这个譬喻同时保留共同受润与实际差异：教法不因对象不同而失去一味，也不要求每个人在同一时刻呈现相同结果。",
    pause: "想一位与你理解速度、表达方式不同的人。今天是否可以先给对方适合他的空间？",
    researchCue:
      "“一味”与“随分”的关系有丰富注疏史。本页只从经文显见的譬喻结构入门；若作义理判断，应继续核对本品长行与相关注疏。",
    segmentId: "T0262.003.0019c24",
    locator: "T0262.003.0019c24–29",
    href: sourceHref("003-0019c", "T0262.003.0019c24"),
    englishHref: soothillHref(5, "GUTENBERG-LOTUS-SOOTHILL-1930.001.s0000014200"),
  },
  {
    id: 4,
    chapter: 10,
    chapterTitle: "法师品",
    title: "把听闻变成一种承持",
    focus: "闻 · 读 · 写 · 说",
    reading:
      "又如來滅度之後，若有人聞妙法華經，乃至一偈一句，一念隨喜者，我亦與授阿耨多羅三藐三菩提記。若復有人受持、讀誦、解說、書寫妙法華經，乃至一偈，於此經卷敬視如佛，種種供養——華、香、瓔珞、末香、塗香、燒香，繒蓋、幢幡、衣服、伎樂，乃至合掌恭敬。",
    hint:
      "这一品把经卷如何继续存在写进经文本身：听闻、受持、读诵、解说、书写，都是不同层次的参与。网站上的“阅读”只是其中一个入口，不等于已经理解，也不替代传统中的诵持与师承。",
    pause: "亲手抄下今天最想留下的一句，并在旁边标记它的稳定行号。",
    researchCue:
      "引文列举的是经内的承持实践，不是本站对用户提出的义务。数字化整理需另守版本、版权与校勘边界；同品英译仅供观察历史表达。",
    segmentId: "T0262.004.0030c07",
    locator: "T0262.004.0030c07–13",
    href: sourceHref("004-0030c", "T0262.004.0030c07"),
    englishHref: soothillHref(10, "GUTENBERG-LOTUS-SOOTHILL-1930.001.s0000020100"),
  },
  {
    id: 5,
    chapter: 15,
    chapterTitle: "从地踊出品",
    title: "承持者，就在此土",
    focus: "从地踊出",
    reading:
      "我娑婆世界自有六萬恒河沙等菩薩摩訶薩，一一菩薩各有六萬恒河沙眷屬，是諸人等，能於我滅後，護持、讀誦、廣說此經。",
    hint:
      "叙事在这里发生转折：承担灭后护持的菩萨并非只从他方到来，而被说成此娑婆世界“自有”。下一段大地震裂、菩萨踊出，把“谁来继续”变成全经后半部的新问题。",
    pause: "不把责任推给遥远的人。今天我能认真保存、核对或传递的，只需是哪一小步？",
    researchCue:
      "本关只引转折前的回答；“从地踊出”的场景紧接下一行。章节结构会在第十六品寿量揭示中继续展开，宜连读两品而非孤立取义。",
    segmentId: "T0262.005.0039c25",
    locator: "T0262.005.0039c25–28",
    href: sourceHref("005-0039c", "T0262.005.0039c25"),
    englishHref: soothillHref(15, "GUTENBERG-LOTUS-SOOTHILL-1930.001.s0000031100"),
  },
  {
    id: 6,
    chapter: 16,
    chapterTitle: "如来寿量品",
    title: "让时间尺度忽然打开",
    focus: "久远实成",
    reading:
      "『今釋迦牟尼佛，出釋氏宮，去伽耶城不遠，坐於道場，得阿耨多羅三藐三菩提。』然，善男子！我實成佛已來無量無邊百千萬億那由他劫。",
    hint:
      "经文先重述众人熟悉的成道时间线，随即以“然”转向久远成佛。阅读重点不是把巨大数字换算成年数，而是观察：当佛的时间尺度被重新打开，前面关于教化、方便与灭度的叙事怎样被改写。",
    pause: "把一件只用眼前得失衡量的事，放进更长的时间里再看一次。感受判断是否发生变化。",
    researchCue:
      "这是本品揭示的开端，后文另以微尘数与良医譬喻展开。各传统对“寿量”的判释不同；本页不将文学结构直接等同于唯一哲学结论。",
    segmentId: "T0262.005.0042b10",
    locator: "T0262.005.0042b10–13",
    href: sourceHref("005-0042b", "T0262.005.0042b10"),
    englishHref: soothillHref(16, "GUTENBERG-LOTUS-SOOTHILL-1930.001.s0000033300"),
  },
  {
    id: 7,
    chapter: 25,
    chapterTitle: "观世音菩萨普门品",
    title: "以能听见，走回众生中",
    focus: "观其音声",
    reading:
      "佛告無盡意菩薩：「善男子！若有無量百千萬億眾生受諸苦惱，聞是觀世音菩薩，一心稱名，觀世音菩薩即時觀其音聲，皆得解脫。",
    hint:
      "“观世音”之名在问答中与众生的苦恼、称名和“观其音声”相连。修持者可以从称名与闻声进入；阅读者也可注意，这一品如何把宏大的教法重新落回具体受苦者。",
    pause: "安静一分钟，先听见身边一个真实需要回应的声音，再决定是否、以及如何行动。",
    researchCue:
      "本段是普门品开端。它属于宗教修持文本，不应被平台改写成对医疗、灾难或人身安全结果的保证；具体处境仍需采取现实可行的求助与防护。",
    segmentId: "T0262.007.0056c05",
    locator: "T0262.007.0056c05–08",
    href: sourceHref("007-0056c", "T0262.007.0056c05"),
    englishHref: soothillHref(25, "GUTENBERG-LOTUS-SOOTHILL-1930.001.s0000044800"),
  },
];

export const fahuajingFullTextHref = fahuajingWorkPath;
export const fahuajingSoothillHref = soothillWorkPath;
