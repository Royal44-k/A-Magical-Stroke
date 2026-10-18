export const LEXICON={
 shared:{label:'共用',pinyin:'gòng yòng',meaning:'大家一起使用。',example:'马良和小禾共用一块画板。',expanded:'这块画板可以给马良画，也可以给小禾画。大家商量着用。'},
 funnel:{label:'漏斗',pinyin:'lòu dǒu',meaning:'上口大、下口小，用来把水等东西集中到小口的器具。',example:'马良把小碗移到漏斗下面接雨。',expanded:'雨滴从大口落进去，再从下面的小口流出来。小碗接在出口下面。'},
 tube:{label:'导管',pinyin:'dǎo guǎn',meaning:'中间空着、能让水等东西从里面通过的管子。',example:'马良把导管接在漏斗出口和小碗之间。',expanded:'雨滴先经过漏斗，再穿过管子，最后落进小碗。两头都要接好。'},
 inlet:{label:'渠口',pinyin:'qú kǒu',meaning:'这里指水渠的入口，水从这里流向水车。',example:'请大人看看渠口，有没有树枝挡着水。',expanded:'先请大人到水渠的入口看一看：水从这里进来，有东西挡住了吗？'},
 trough:{label:'水槽',pinyin:'shuǐ cáo',meaning:'这里指上面敞开的长槽，用来引水。',example:'把水提到高处，再沿着接好的水槽送向田边。',expanded:'水先被提起来，再顺着一段接一段的长槽流向田边。只在低处摆好槽，水不会自己往高处走。'},
 frame:{label:'支架',pinyin:'zhī jià',meaning:'托住或撑住物品的架子。这里的支架用来稳住水车。',example:'请鲁伯装好支架，再让水车试着转起来。',expanded:'先请鲁伯把撑住水车的架子装稳，再试水车。'},
 rotate:{label:'轮换',pinyin:'lún huàn',meaning:'一个人做一会儿，再换另一个人来做。',example:'鲁伯和陈叔轮换着提水。',expanded:'鲁伯先提一会儿水，陈叔再接着提，两个人换着来。'},
 handoff:{label:'交接',pinyin:'jiāo jiē',meaning:'把要接着做的事交给下一个人，并把做法和情况告诉他。',example:'马良和鲁伯交接时，把试水的做法讲了一遍。',expanded:'马良说明先看哪里、再做什么，还请鲁伯照着试试。交接不只是换个人站在旁边。'},
 contract:{label:'契书',pinyin:'qì shū',meaning:'写下约定的文书。读清上面写的事，再想想要不要答应。',example:'小禾把契书展开，指给马良看下面那一行字。',expanded:'小禾打开写着条件的纸卷，请马良把后面的话也读一读。'},
 draft:{label:'草案',pinyin:'cǎo àn',meaning:'先写下的一份办法，还要请大家商量，再定下来。',example:'大家照着草案试了一回，又改了一句话。',expanded:'这份办法还没定好。大家先试试，看看哪里需要改。'},
 agreement:{label:'约定',pinyin:'yuē dìng',meaning:'大家一起说好要怎样做的事。',example:'大家约定，按排好的次序来取水。',expanded:'大家一起说好了：谁先来，谁接着来，就照商量好的次序取水。'},
 support:{label:'支点',pinyin:'zhī diǎn',meaning:'在纸桥这一幕里，指托住桥头或桥尾的位置。',example:'桥的两头都放好支点，再请纸人试走。',expanded:'桥头和桥尾都要有地方托住。先看看两端，再让纸人往前走。'},
 landing:{label:'落点',pinyin:'luò diǎn',meaning:'在纸桥这一幕里，指桥的另一头放下来的地方。',example:'画桥前，先看看另一头的落点在哪里。',expanded:'桥要从这边通到哪里？先找一个桥尾能放下、纸人还能接着往前走的地方。'},
 borrow:{label:'借阅',pinyin:'jiè yuè',meaning:'把书借来阅读，读后按约定归还。',example:'借阅图书角的书时，先看看大家的约定。',expanded:'借书前，看看怎样拿、怎样记。读完以后，再按说好的办法把书还回来。'}
};
const SCENE_WORDS={home:['inlet','trough','handoff'],rain:['funnel','tube'],gift:['shared'],observe:['inlet','trough','frame'],workshop:['trough','frame','inlet','rotate'],handoff:['handoff','rotate','inlet','trough'],contract:['contract','agreement','draft'],court:['draft','agreement','contract','handoff'],review:['handoff','agreement','trough'],ending:['agreement','handoff'],classroom:['borrow','agreement']};
export const wordIdsFor=(stage,strategy)=>stage==='court'&&strategy==='bridge'?['landing','support','agreement']:SCENE_WORDS[stage]||SCENE_WORDS.home;
export const emptyReadingHelp=()=>({size:'normal',bookmarks:[],notes:{}});
const known=id=>Object.hasOwn(LEXICON,id);
export function validReadingHelp(h){return !!h&&['normal','large'].includes(h.size)&&Array.isArray(h.bookmarks)&&h.bookmarks.length<=Object.keys(LEXICON).length&&h.bookmarks.every(known)&&new Set(h.bookmarks).size===h.bookmarks.length&&!!h.notes&&typeof h.notes==='object'&&!Array.isArray(h.notes)&&Object.entries(h.notes).every(([id,text])=>known(id)&&typeof text==='string'&&text.length<=160);}
export function toggleWord(h,id){if(!known(id))return h;return {...h,bookmarks:h.bookmarks.includes(id)?h.bookmarks.filter(x=>x!==id):[...h.bookmarks,id]};}
export function writeWordNote(h,id,text){if(!known(id)||typeof text!=='string')return h;const notes={...h.notes};if(text.trim())notes[id]=text.slice(0,160);else delete notes[id];return {...h,notes};}
export function readingRecords(h){return Object.entries(LEXICON).filter(([id])=>h.bookmarks.includes(id)||h.notes[id]).map(([id,word])=>({id,...word,bookmarked:h.bookmarks.includes(id),note:h.notes[id]||''}));}
export function readingText(h){const records=readingRecords(h);return records.length?['我的词语页',...records.map(w=>w.label+'（'+w.pinyin+'）\n这里的意思：'+w.meaning+(w.bookmarked?'\n我留了书签。':'')+(w.note?'\n我写的一句：'+w.note:''))].join('\n\n'):'';}
