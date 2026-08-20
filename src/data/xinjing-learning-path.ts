export type XinjingLearningDay = {
  id: number;
  title: string;
  focus: string;
  reading: string;
  hint: string;
  pause: string;
  segmentId: string;
  locator: string;
  href: string;
};

const xinjingFolioPath = "/jingzang/xinjing/001-0848c";

export const xinjingLearningDays: XinjingLearningDay[] = [
  {
    id: 1,
    title: "从“照见”开始",
    focus: "五蕴与离苦",
    reading: "观自在菩萨，行深般若波罗蜜多时，照见五蕴皆空，度一切苦厄。",
    hint:
      "经文先写一种正在发生的观照，而不是先给出抽象结论。色、受、想、行、识被称为五蕴；入门时，先把它们看作不断变化的经验组合。",
    pause: "今天只留意一次：一种强烈感受升起后，它有没有一直不变？",
    segmentId: "T0251.001.0848c06",
    locator: "T0251.001.0848c06–07",
    href: `${xinjingFolioPath}#T0251.001.0848c06`,
  },
  {
    id: 2,
    title: "色与空不相离",
    focus: "色不异空",
    reading: "舍利子！色不异空，空不异色；色即是空，空即是色。受、想、行、识，亦复如是。",
    hint:
      "这里没有把“色”与“空”分成两个世界。简要地说：经验真实发生，却找不到一个脱离条件、永远不变的自性。空不是把生活抹去。",
    pause: "看一件眼前的物品：它依赖了哪些材料、关系与条件才来到这里？",
    segmentId: "T0251.001.0848c07",
    locator: "T0251.001.0848c07–08",
    href: `${xinjingFolioPath}#T0251.001.0848c07`,
  },
  {
    id: 3,
    title: "不落在两边",
    focus: "不生不灭",
    reading: "舍利子！是诸法空相：不生不灭，不垢不净，不增不减。",
    hint:
      "这组相对词提醒我们，不要急着把流动的经验固定成绝对的“有或无、好或坏、多或少”。它不是说变化不存在，而是松开对固定标签的执取。",
    pause: "找出今天给自己贴过的一个标签，问：它能概括全部的我吗？",
    segmentId: "T0251.001.0848c09",
    locator: "T0251.001.0848c09–10",
    href: `${xinjingFolioPath}#T0251.001.0848c09`,
  },
  {
    id: 4,
    title: "读一连串的“无”",
    focus: "松开概念清单",
    reading:
      "是故空中无色，无受、想、行、识；无眼、耳、鼻、舌、身、意；无色、声、香、味、触、法；无眼界，乃至无意识界。",
    hint:
      "经文逐层点出我们用来整理世界的类别。这里的“无”不必读成否认感官和作用；可以先读成：别把任何类别当作独立、恒常、可抓住的实体。",
    pause: "当一个念头出现时，只说“这是一个念头”，不急着跟随它一分钟。",
    segmentId: "T0251.001.0848c10",
    locator: "T0251.001.0848c10–12",
    href: `${xinjingFolioPath}#T0251.001.0848c10`,
  },
  {
    id: 5,
    title: "无所得，心无罣碍",
    focus: "从抓取到无碍",
    reading:
      "无苦、集、灭、道；无智，亦无得。以无所得故，菩提萨埵依般若波罗蜜多故，心无罣碍；无罣碍故，无有恐怖。",
    hint:
      "“无所得”不是放弃学习或行动，而是连智慧与成果也不据为固定的“我所有”。经文把少一分抓取，与少一分罣碍和恐怖连在一起。",
    pause: "今天做一件该做的事，完成后暂时不评价自己做得够不够好。",
    segmentId: "T0251.001.0848c13",
    locator: "T0251.001.0848c13–15",
    href: `${xinjingFolioPath}#T0251.001.0848c13`,
  },
  {
    id: 6,
    title: "般若是一条路",
    focus: "依般若而行",
    reading:
      "远离颠倒梦想，究竟涅槃。三世诸佛依般若波罗蜜多故，得阿耨多罗三藐三菩提。故知般若波罗蜜多，是大神咒、是大明咒、是无上咒、是无等等咒。",
    hint:
      "般若在这里不只是知道一个道理，而是被反复写成所依之道。入门不必急着掌握全部术语；先注意经文如何从观照、无所得，走向无碍与觉悟。",
    pause: "用一句自己的话，说说这六天里“空”最不像什么。",
    segmentId: "T0251.001.0848c16",
    locator: "T0251.001.0848c16–19",
    href: `${xinjingFolioPath}#T0251.001.0848c16`,
  },
  {
    id: 7,
    title: "把理解放回诵读",
    focus: "揭帝，揭帝",
    reading: "揭帝揭帝，般罗揭帝，般罗僧揭帝，菩提莎婆诃。",
    hint:
      "经文以咒语收束。初学时不必把每个音节硬译成概念；可以听见一种“去、去、到彼岸去”的行进感，并把七天的理解重新放回整部经。",
    pause: "完整读一遍《心经》。遇到仍不懂的地方，只做一个记号，保留继续求证的路。",
    segmentId: "T0251.001.0848c20",
    locator: "T0251.001.0848c20–22",
    href: `${xinjingFolioPath}#T0251.001.0848c20`,
  },
];

export const xinjingFullTextHref = `${xinjingFolioPath}#T0251.001.0848c03`;
