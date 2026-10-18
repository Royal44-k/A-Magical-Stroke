// A return bookmark is optional UI state; a damaged bookmark must not erase a child's work.
export function emptyNavigation(){return {back:null};}
export function restoreNavigation(value,visited,current){
 const back=value?.back;
 if(back===null)return emptyNavigation();
 if(!back||!['rain','gift','observe','workshop','handoff','contract','court','review','ending'].includes(back.stage)||!['play','classroom'].includes(back.screen)||!['repair','revisit'].includes(back.mode))return emptyNavigation();
 if(back.mode==='repair'&&(back.stage!=='review'||back.screen!=='play'))return emptyNavigation();
 if(back.screen==='classroom'&&back.stage!=='ending')return emptyNavigation();
 if(back.mode==='revisit'&&!visited.includes(back.stage)&&back.stage!==current)return emptyNavigation();
 return {back:{stage:back.stage,screen:back.screen,mode:back.mode}};
}
