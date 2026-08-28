export type JingangjingLearningDay = {
  id: number;
  title: string;
  focus: string;
  reading: string;
  hint: string;
  pause: string;
  researchCue: string;
  segmentId: string;
  locator: string;
  href: string;
};

const jingangjingWorkPath = "/jingzang/jingangjing";

function sourceHref(folio: string, segmentId: string) {
  return `${jingangjingWorkPath}/${folio}#${segmentId}`;
}

export const jingangjingLearningDays: JingangjingLearningDay[] = [
  {
    id: 1,
    title: "先把问题问清楚",
    focus: "云何住心",
    reading:
      "善男子、善女人，發阿耨多羅三藐三菩提心，應云何住？云何降伏其心？",
    hint:
      "这条路径先不急着给“无住”下定义。经文从一个具体问题开始：已经发心的人，心如何安住，又如何面对不断生起的攀缘？先保留问题，读后文怎样反复回应。",
    pause: "写下此刻最牵动心的一件事。先不判断它，只观察心正在抓住什么。",
    researchCue:
      "本段从版页行中截取完整问句；查看原典时，请同时阅读前后关于发心与付嘱的语境。",
    segmentId: "T0235.001.0748c27",
    locator: "T0235.001.0748c27–29",
    href: sourceHref("001-0748c", "T0235.001.0748c27"),
  },
  {
    id: 2,
    title: "度众生，不占有众生",
    focus: "无四相",
    reading:
      "如是滅度無量、無數、無邊眾生，實無眾生得滅度者。何以故？須菩提！若菩薩有我相、人相、眾生相、壽者相，即非菩薩。",
    hint:
      "经文把广大的愿行与“不把任何对象固定下来”放在同一段。入门时可先注意这个张力：行动没有被取消，但行动者、被帮助者与功德都不被据为固定的“我所有”。",
    pause: "回想一次帮助他人的经验：如果不急着确认“是我帮助了谁”，行动会有什么不同？",
    researchCue:
      "“我相、人相、众生相、寿者相”的解释传统很多；本页只指出段内结构，不替代注疏判释。",
    segmentId: "T0235.001.0749a09",
    locator: "T0235.001.0749a09–11",
    href: sourceHref("001-0749a", "T0235.001.0749a09"),
  },
  {
    id: 3,
    title: "布施而不住相",
    focus: "无所住行",
    reading:
      "復次，須菩提！菩薩於法應無所住行於布施，所謂不住色布施，不住聲、香、味、觸、法布施。須菩提！菩薩應如是布施，不住於相。",
    hint:
      "这里的“不住”出现在布施这一行动中，不是退回什么都不做。可先把注意力放在动词上：仍然布施，同时不让感官对象、评价与自我形象成为必须依附的条件。",
    pause: "今天做一件不求被看见的小事。做完后，观察心是否仍在等待回报或肯定。",
    researchCue:
      "引文在原典下一行继续说明福德；本日只截取到“不住于相”，不把后句含义并入摘要。",
    segmentId: "T0235.001.0749a12",
    locator: "T0235.001.0749a12–14",
    href: sourceHref("001-0749a", "T0235.001.0749a12"),
  },
  {
    id: 4,
    title: "见相而不执相",
    focus: "诸相非相",
    reading: "凡所有相，皆是虛妄；若見諸相非相，則見如來。",
    hint:
      "“非相”不必先理解成否定眼前一切。可从经文自身的辨析读起：相会呈现，却不应被当成固定、独立、足以代表实相的东西。",
    pause: "看一个你已经下定论的人或事，问自己：我是否把一个暂时呈现的“相”当成了全部？",
    researchCue:
      "这是从完整段落中截出的两行名句；不同译本的措辞与句界应分别核对，不在本页自动等同。",
    segmentId: "T0235.001.0749a24",
    locator: "T0235.001.0749a24–25",
    href: sourceHref("001-0749a", "T0235.001.0749a24"),
  },
  {
    id: 5,
    title: "连教法也不抓住",
    focus: "筏喻",
    reading: "如來常說：『汝等比丘，知我說法，如筏喻者，法尚應捨，何況非法。』",
    hint:
      "筏是渡越的工具，不是抵达后仍须背负的身份。这里不是说学习与实践无用，而是提醒：连有效的方法也可能被占有、标榜或固化。",
    pause: "找出一个曾经帮助过你的方法。它现在仍在服务当下，还是已经变成必须维护的标签？",
    researchCue:
      "本页不据此建立“什么都应舍”的泛化结论；请回到前文关于说法、得法与取法的问答。",
    segmentId: "T0235.001.0749b10",
    locator: "T0235.001.0749b10–11",
    href: sourceHref("001-0749b", "T0235.001.0749b10"),
  },
  {
    id: 6,
    title: "无住，不等于无心",
    focus: "生清净心",
    reading:
      "菩薩摩訶薩應如是生清淨心，不應住色生心，不應住聲、香、味、觸、法生心，應無所住而生其心。",
    hint:
      "经文把“无所住”与“生其心”连在一起。它没有要求停止发心，而是在发心与行动时，不把心固定在色、声、香、味、触、法上。",
    pause: "为今天真正重要的一件事发心，然后松开对结果必须符合预期的要求。",
    researchCue:
      "“应无所住而生其心”位于一段连续问答中；熟悉的单句不能代替对整段语法和诸译本的核读。",
    segmentId: "T0235.001.0749c21",
    locator: "T0235.001.0749c21–23",
    href: sourceHref("001-0749c", "T0235.001.0749c21"),
  },
  {
    id: 7,
    title: "把一切放回流变中看",
    focus: "如是观",
    reading: "一切有為法，如夢、幻、泡、影，如露亦如電，應作如是觀。",
    hint:
      "六个譬喻共同指向迅速生灭、依条件显现的经验。可先把它当作一种观看练习：不是抹去发生过的事，而是不再要求它永久停驻。",
    pause: "完整读一遍《金刚经》。最后只问：今天有什么被我看得比昨天稍微松动了一点？",
    researchCue:
      "偈颂前文谈到“为人演说”与“不取于相”；本日链接会落到偈颂首行，请向上阅读一行。",
    segmentId: "T0235.001.0752b28",
    locator: "T0235.001.0752b28–29",
    href: sourceHref("001-0752b", "T0235.001.0752b28"),
  },
];

export const jingangjingFullTextHref = jingangjingWorkPath;
export const jingangjingEnglishHref = "/jingzang/gutenberg-en-diamond-gemmell";
