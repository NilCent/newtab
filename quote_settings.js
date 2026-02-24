const QKEY='quotesDataset';
const listEl=document.getElementById('list');
const searchEl=document.getElementById('search');
const addBtn=document.getElementById('add');
const newText=document.getElementById('new-text');
const newAuthor=document.getElementById('new-author');
const closeBtn=document.getElementById('close-panel');
const prevBtn=document.getElementById('prev');
const nextBtn=document.getElementById('next');
const pageInfo=document.getElementById('page-info');
const S={get:async(k,d)=>{if(typeof chrome!=='undefined'&&chrome?.storage?.local){return new Promise(r=>chrome.storage.local.get([k],v=>r(v?.[k]??d)))}try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}},set:async(k,v)=>{if(typeof chrome!=='undefined'&&chrome?.storage?.local){return new Promise(r=>chrome.storage.local.set({[k]:v},r))}localStorage.setItem(k,JSON.stringify(v))}};
const state={all:[],query:'',page:1,size:20};
async function ensureSeed(){let ds=await S.get(QKEY,null);if(!ds||!Array.isArray(ds)||ds.length===0){try{const res=await fetch('./quotes.json',{cache:'no-cache'});const data=await res.json();if(Array.isArray(data)&&data.length){ds=data;await S.set(QKEY,ds)}else{ds=[]}}catch{ds=[]}}return ds}
function filtered(){const q=state.query.toLowerCase();return state.all.filter(it=>(it.t||'').toLowerCase().includes(q)||(it.a||'').toLowerCase().includes(q))}
function render(){const data=filtered();const total=data.length;const pages=Math.max(1,Math.ceil(total/state.size));if(state.page>pages)state.page=pages;const start=(state.page-1)*state.size;const pageData=data.slice(start,start+state.size);if(pageData.length===0){listEl.innerHTML='<div class="small">没有匹配项</div>'}else{listEl.innerHTML=pageData.map(it=>{const t=(it.t||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');const a=(it.a||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');const k=(it.t||'')+'||'+(it.a||'');return `<div class="item" data-k="${k}" tabindex="0"><button class="del" title="删除">×</button><div>${t}</div><div class="meta"><span>${a?`— ${a}`:''}</span></div></div>`}).join('')}
pageInfo.textContent=`第 ${state.page} / ${pages} 页 • 共 ${total} 条`;prevBtn.disabled=state.page<=1;nextBtn.disabled=state.page>=pages;
listEl.querySelectorAll('.item').forEach(card=>{card.addEventListener('contextmenu',e=>{e.preventDefault();listEl.querySelectorAll('.item.mark').forEach(n=>n.classList.remove('mark'));card.classList.add('mark')});const del=card.querySelector('.del');del.addEventListener('click',async e=>{e.stopPropagation();const k=card.getAttribute('data-k');let ds=await S.get(QKEY,[]);ds=ds.filter(x=>((x.t||'')+'||'+(x.a||''))!==k);await S.set(QKEY,ds);state.all=ds;render()})})}
async function init(){state.all=await ensureSeed();render()}
addBtn.addEventListener('click',async()=>{const t=(newText.value||'').trim();const a=(newAuthor.value||'').trim();if(!t)return;let ds=await S.get(QKEY,[]);ds=[{t,a},...ds];await S.set(QKEY,ds);state.all=ds;state.page=1;newText.value='';newAuthor.value='';render()});
searchEl.addEventListener('input',()=>{state.query=(searchEl.value||'').trim();state.page=1;render()});
prevBtn.addEventListener('click',()=>{if(state.page>1){state.page--;render()}});
nextBtn.addEventListener('click',()=>{const pages=Math.max(1,Math.ceil(filtered().length/state.size));if(state.page<pages){state.page++;render()}})
closeBtn.addEventListener('click',()=>{try{window.parent?.postMessage({type:'closePanel'},'*')}catch{}});init();
// 点击非红 x 区域时，隐藏所有红 x
document.addEventListener('click',(e)=>{if(!(e.target.closest&&e.target.closest('.del'))){listEl.querySelectorAll('.item.mark').forEach(n=>n.classList.remove('mark'))}});
