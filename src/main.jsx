import React,{lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import AppV5 from './v5/AppV5.jsx';
const AppV4=lazy(()=>import('./v4/AppV4.jsx')),AppV3=lazy(()=>import('./v3/AppV3.jsx')),Legacy=lazy(()=>import('./legacy-entry.jsx'));
const edition=new URLSearchParams(location.search).get('edition');
createRoot(document.getElementById('root')).render(<React.StrictMode><Suspense fallback={<p>正在展开画卷……</p>}>{edition==='archive'?<Legacy/>:edition==='3.1'?<AppV3/>:edition==='4.0'?<AppV4/>:<AppV5/>}</Suspense></React.StrictMode>);
