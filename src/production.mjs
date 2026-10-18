export const CLIPS=[
['M-V01','rain','河边的难题','opening-field-v1.png','小禾提来半桶水。马良用炭枝画了个圆轮，抬头看看河，又看看高处的田。'],
['M-V02','rain','雨夜得笔','night-brush-v2.png','雨从屋顶滴下来。桌上的笔忽然亮了。马良画了一个小漏斗：先在纸上试试，让雨滴找到碗。'],
['M-V03','gift','第一笔画什么','worktable-day-v1.png','屋顶漏雨，木桶裂了，大家也想有一块共用的画板。先画哪一件？马良想听听你的主意。'],
['M-V04','observe','走近一点看','river-survey-v1.png','河里有水，田比河高，门前还有人来往。马良没有急着画，先去问问大家。'],
['M-V05','workshop','纸上的小村庄','ink-workshop-v1.png','墨盘里出现一座小村庄。接一节水槽，转一个方向，水会走到哪里？'],
['M-V06','handoff','交给下一双手','shared-board-v1.png','马良说，我可以天天来。小禾问，你有事的时候呢？鲁伯拿出木牌：把名字和做法写清楚吧。'],
['M-V07','contract','卷轴下面的话','grain-contract-v1.png','大官带来粮袋：把笔交给我，粮今日就分。小禾发现，卷轴下面还压着一行字。'],
['M-V08','court','画中海','court-sea-v1.png','马良拿起神笔，纸上出现一片海和一只小金船。船上没有人，海水还留在纸里。路画出来，谁能走？'],
['M-V09P','court','把话说清楚','court-sea-v1.png','鲁伯请大家看看图：先把话卡摆出来，再听听大家的疑问。今天能用的办法，到了明天还能用吗？'],
['M-V09B','court','给人留一条路','paper-bridge-v1.png','桥还在图里。先画清落点、桥面和两端支点，再请鲁伯在图上检查，让纸人试走。'],
['M-V10','review','灯下再看约定','evening-review-v1.png','画收起来了，约定要再看一看。哪一句改过了？哪一句还在？小禾把图推近了些。'],
['M-V11','review','再添一笔','evening-review-v1.png','神笔旁边，放着普通木尺。谁来接手，怎样使用，还有哪里能改？把想到的留下来。'],
['M-VE1','ending','大家都会用了','shared-board-v1.png','水路试过了，接手的人和做法也写清楚了。马良退后一步：现在，下一双手也能接着做。'],
['M-VE2','ending','这一笔补好了','evening-review-v1.png','原来的图没有扔，新的办法放在旁边。你后来补上了什么？请大家再来看一看。'],
['M-VE3','ending','木牌还挡在路上','ending-conditions-v1.png','你答应先领粮，“签了才准用水”的条件也留了下来。带上大家的话，再去谈一谈。'],
['M-VE4','ending','还有一处等你来画','evening-review-v1.png','图上还有没想周全的地方。把要补的事记下来，我们一起接着画。'],
['M-V12','classroom','班级图书角','classroom-library-v1.png','故事讲完了，办法还能用到哪里？给图书角留张小纸条，看看伙伴能不能照着找到书。']
].map(([id,stage,title,asset,text])=>({id,stage,title,poster:'/assets/'+asset,text}));
export function clipsFor(s){let list=CLIPS.filter(c=>c.stage===s.stage);if(s.stage==='court')list=list.filter(c=>c.id==='M-V08'||c.id===(s.strategy==='bridge'?'M-V09B':'M-V09P'));if(s.stage==='ending')list=list.filter(c=>c.id==='M-V'+(s.currentEnding||'E4'));return list;}
