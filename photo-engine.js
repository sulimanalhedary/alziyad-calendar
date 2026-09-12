/* Curated Wikimedia Commons candidates. Photos enter the gallery only after
   metadata/license validation. Network failure preserves the existing gallery. */
const GALLERY_CACHE='ziyad-photo-bytes-v1';
const META_KEY='ziyad-photo-metadata-v8';
const STATE_KEY='ziyad-photo-choice-v8';
const normalizeTitle=s=>String(s).replaceAll('_',' ').normalize('NFC');
function readSaved(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function saveValue(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function plainText(value){const doc=new DOMParser().parseFromString(String(value||''),'text/html');return (doc.body.textContent||'').replace(/\s+/g,' ').trim()}
function trustedURL(value,hosts){try{const u=new URL(value);return u.protocol==='https:'&&hosts.includes(u.hostname)}catch{return false}}
function licensedPhoto(page,candidate){
 const info=page?.imageinfo?.[0],m=info?.extmetadata;if(!info||!m)return null;
 const license=plainText(m.LicenseShortName?.value),author=plainText(m.Artist?.value);
 if(!/^(CC BY(?:-SA)? [\d.]+|CC0(?: [\d.]+)?|Public domain)$/i.test(license)||!author)return null;
 const url=info.thumburl||info.url;
 if(!trustedURL(url,['upload.wikimedia.org','thumb.wikimedia.org'])||!trustedURL(info.descriptionurl,['commons.wikimedia.org']))return null;
 if(!/^image\/(jpeg|png|webp)$/.test(info.mime)||Math.min(info.width||0,info.height||0)<600)return null;
 const licenseUrl=m.LicenseUrl?.value||'';
 if(license.startsWith('CC')&&!trustedURL(licenseUrl,['creativecommons.org']))return null;
 return {id:normalizeTitle(candidate.title),title:candidate.title.slice(5),loc:candidate.loc,url,pos:'center',author,license,licenseUrl,source:info.descriptionurl,credit:author+' • '+license};
}
function riyadhDay(){return Math.floor((Date.now()+3*3600000)/86400000)}
function rememberChoice(){const p=currentPhoto();saveValue(STATE_KEY,{day:riyadhDay(),filter,id:p.id||p.url})}
function restoreChoice(){const saved=readSaved(STATE_KEY);const list=eligible();if(!list.length)return;const match=saved?.day===riyadhDay()&&saved.filter===filter?list.find(x=>(x.p.id||x.p.url)===saved.id):null;photoIndex=match?match.i:list[riyadhDay()%list.length].i}
function updateGalleryStatus(message){
 const counts=['الرياض','ثادق','الدرعية','من أعمالنا'].map(loc=>loc+': '+PHOTOS.filter(p=>p.loc===loc).length);
 document.getElementById('galleryStatus').textContent=message+' — '+counts.join(' • ');
}
function mergeMetadata(rows){
 const known=new Map(PHOTO_CATALOG.map(c=>[normalizeTitle(c.title),c]));
 for(const row of rows){const candidate=known.get(row.id);if(!candidate||!trustedURL(row.url,['upload.wikimedia.org','thumb.wikimedia.org'])||row.loc!==candidate.loc)continue;
 const existing=PHOTOS.findIndex(p=>p.id===row.id||p.url===row.url);
 if(existing>=0)PHOTOS[existing]=row;else PHOTOS.push(row);
 }
}
async function requestMetadata(batch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const params=new URLSearchParams({action:'query',format:'json',formatversion:'2',origin:'*',prop:'imageinfo',titles:batch.map(x=>x.title).join('|'),iiprop:'url|extmetadata|mime|size',iiurlwidth:'1440',iiextmetadatafilter:'Artist|LicenseShortName|LicenseUrl',redirects:'1'});
  const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params,{signal:controller.signal,credentials:'omit'});
  if(!response.ok)throw Error('metadata unavailable');const data=await response.json();if(data.error)throw Error('metadata error');
  const pages=data.query?.pages||[],mapping=new Map([...data.query?.normalized||[],...data.query?.redirects||[]].map(x=>[normalizeTitle(x.from),normalizeTitle(x.to)]));
  return batch.map(candidate=>{let title=normalizeTitle(candidate.title);for(let i=0;i<4&&mapping.has(title);i++)title=mapping.get(title);return licensedPhoto(pages.find(p=>normalizeTitle(p.title)===title),candidate)}).filter(Boolean);
 }finally{clearTimeout(timer)}
}
let galleryBusy=false;
async function initializeGallery(refresh=false){
 if(galleryBusy)return;galleryBusy=true;
 const cached=readSaved(META_KEY);if(Array.isArray(cached?.photos))mergeMetadata(cached.photos);
 restoreChoice();render();updateGalleryStatus('صور جاهزة للاختيار');if(!refresh){galleryBusy=false;return}
 if(cached?.complete&&Date.now()-cached.saved<7*86400000){galleryBusy=false;return}
 let rows=Array.isArray(cached?.photos)?cached.photos:[],complete=true;
 try{
  for(let i=0;i<PHOTO_CATALOG.length;i+=5){
   updateGalleryStatus('جاري تحديث مجموعة الصور…');
   const fresh=await requestMetadata(PHOTO_CATALOG.slice(i,i+5));
   for(const p of fresh){const old=rows.findIndex(x=>x.id===p.id);if(old>=0)rows[old]=p;else rows.push(p)}
   mergeMetadata(fresh);saveValue(META_KEY,{photos:rows,saved:Date.now(),complete:false});
  }
 }catch(e){complete=false;console.warn('Photo catalog unavailable',e.name)}
 finally{saveValue(META_KEY,{photos:rows,saved:Date.now(),complete});galleryBusy=false;updateGalleryStatus(complete?'تم تحديث مجموعة الصور':'تعذر استكمال الصور الجديدة؛ الصور الحالية متاحة. أعد المحاولة عند توفر الاتصال');}
 // Respect manual choices made while metadata was loading.
 restoreChoice();render();
}
const originalLoadImage=loadImg;
loadImg=async function(src){
 if(src.startsWith('data:')||!/^https:/.test(src))return originalLoadImage(src);
 let cache=null,response=null;try{cache=await caches.open(GALLERY_CACHE);response=await cache.match(src)}catch{}
 if(!response){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{response=await fetch(src,{signal:controller.signal,credentials:'omit'});if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('photo unavailable');if(cache)try{await cache.put(src,response.clone())}catch{}}finally{clearTimeout(timer)}}
 const blob=await response.blob(),url=URL.createObjectURL(blob);try{return await originalLoadImage(url)}finally{URL.revokeObjectURL(url)}
};
const changeImage=nextImage;nextImage=function(){changeImage();rememberChoice()};
const changeFilter=filterLoc;filterLoc=function(loc,button){if(loc!=='all'&&!PHOTOS.some(p=>p.loc===loc)){updateGalleryStatus('صور '+loc+' لم تُحمّل بعد. اضغط تحديث مجموعة الصور مع الاتصال بالإنترنت');return}changeFilter(loc,button);restoreChoice();render();rememberChoice()};
function showPhotoSource(photo){
 const box=document.getElementById('photoSource');box.replaceChildren();
 if(!photo.source)return;
 const link=document.createElement('a');link.href=photo.source;link.target='_blank';link.rel='noopener';link.textContent='مصدر الصورة: '+photo.title;box.append(link);
 box.append(document.createTextNode(' — '+photo.author+' • '+photo.license+' • قصّ للصورة وإضافة نص'));
 if(photo.licenseUrl){const license=document.createElement('a');license.href=photo.licenseUrl;license.target='_blank';license.rel='noopener';license.textContent=' • شروط الاستخدام';box.append(license)}
}
let daySeen=riyadhDay();setInterval(()=>{if(riyadhDay()!==daySeen){daySeen=riyadhDay();today=new Date();restoreChoice();render();renderEvents()}},60000);
