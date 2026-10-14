/* =========================================================
   PROYECTO SHERLOCK · Lee, razona y resuelve el misterio
   Los casos están en data/casos.json y las imágenes en img/.
   Para cambiar una imagen, sustituye el archivo manteniendo el
   mismo nombre, o cambia la ruta en casos.json.
   ========================================================= */
(function(){
"use strict";
var D=null,app=document.getElementById("app");
var HERO_SEGUNDOS=7;          // segundos que tarda en cambiar el caso destacado
var CARGA_MS=3600;            // duración de la pantalla de carga
var MIN_PALABRAS=50;          // palabras mínimas de cada respuesta del cuestionario
var AVISOS_SALIDA=1;          // avisos antes de borrar el cuestionario si el alumno sale de la página

var LOGO="img/general/logotipo.png";   // logotipo del proyecto (cámbialo aquí si usas otro nombre)
var LENS='<img class="lens" src="'+LOGO+'" alt="" onerror="this.remove()">';
var LUPA='<svg class="lens" viewBox="0 0 64 64" aria-hidden="true"><circle cx="26" cy="26" r="17" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="26" cy="26" r="11" fill="currentColor" opacity=".18"/><path d="M38.5 38.5 L56 56" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><path d="M18 20 Q22 14 30 15" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></svg>';   // lupa de la pantalla de carga
var VERSION_IMG="4";          // si cambias imágenes y el navegador muestra las antiguas, sube este número
var ARR_L='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',ARR_R='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l14 8-14 8z" fill="currentColor"/></svg>';

/* ---------- utilidades ---------- */
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")}
function ls(k,d){try{var v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function sub(id){for(var i=0;i<D.asignaturas.length;i++)if(D.asignaturas[i].id===id)return D.asignaturas[i];return D.asignaturas[0]}
function caso(id){for(var i=0;i<D.casos.length;i++)if(D.casos[i].id===id)return D.casos[i];return null}
function porAsig(id){return D.casos.filter(function(c){return c.asignatura===id})}
function ans(c){return (c.respuesta|0)-1}
function iniciales(n){return n.trim().split(/\s+/).slice(0,2).map(function(x){return x[0]}).join("").toUpperCase()}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function ver(src){return src+(src.indexOf("?")<0?"?v=":"&v=")+VERSION_IMG}
function img(src,alt,cls){return '<img src="'+esc(ver(src))+'" alt="'+esc(alt||"")+'"'+(cls?' class="'+cls+'"':'')+' loading="lazy" decoding="async">'}

/* ---------- estado ---------- */
var st={screen:"gate",name:ls("sherlock-nombre",""),sub:null,ci:null,detail:null,shown:1,out:[],tab:"pis",dossier:null,pick:null,result:null,tries:0,fresh:false,err:"",flash:null,hero:0,feat:[]};
function doneKey(){return "sherlock-resueltos-"+st.name.toLowerCase()}
function doneList(){return ls(doneKey(),[])}
function isDone(id){return doneList().indexOf(id)>-1}

/* ---------- piezas comunes ---------- */
function logo(){return '<button class="logo" data-a="home" aria-label="Proyecto Sherlock, ir al inicio">'+LENS+'<span class="lt"><b>PROYECTO <span>SHERLOCK</span></b><small>LEE, RAZONA Y RESUELVE EL MISTERIO</small></span></button>'}
function topbar(){var h='<header class="top"><div class="wrap">'+logo()+'<nav class="nav" aria-label="Asignaturas"><button data-a="home" aria-current="'+(st.screen==="home")+'">Inicio</button>';
 D.asignaturas.forEach(function(s){h+='<button data-a="sub" data-s="'+s.id+'" aria-current="'+(st.screen==="sub"&&st.sub===s.id)+'">'+esc(s.corto)+'</button>'});
 return h+'</nav><button class="help" data-a="help" aria-label="Cómo se juega" title="Cómo se juega">?</button><button class="me" data-a="logout" title="Cambiar de alumno"><span class="av">'+esc(iniciales(st.name))+'</span><span class="nm">'+esc(st.name)+'</span></button></div></header>'}
function pw(c,extra){var s=sub(c.asignatura);return '<div class="pw" style="--sc:'+s.color+'">'+img(c.portada,"Portada de "+c.titulo)+'<span class="badge">S</span><div class="ttl"><i></i>'+esc(c.titulo)+'</div>'+(extra||"")+'</div>'}
function posterCard(c,withDesc){var d=isDone(c.id);
 return '<button class="card" data-a="detail" data-id="'+c.id+'" aria-label="'+esc(c.titulo)+'">'+pw(c,(d?'<span class="badge-done">RESUELTO</span>':'')+'<div class="ov">'+esc(c.resumen)+'</div>')+'<div class="cm"><span>'+esc(c.epoca)+'</span>'+(c.idioma==="en"?'<span class="lang-en">EN</span>':'')+'</div>'+(withDesc?'<div class="desc">'+esc(c.resumen)+'</div>':'')+'</button>'}

/* ---------- pantalla de nombre ---------- */
function gate(){
 return '<main class="gate"><form class="gate-in" id="gateform" autocomplete="off"><div class="biglogo"><div class="lensbig">'+LENS+'</div><h1>PROYECTO<br><span>SHERLOCK</span></h1><p>Lee, razona y resuelve el misterio</p></div>'+
 '<div class="field"><label for="nm">Escribe tu nombre y apellidos</label><input id="nm" name="nm" maxlength="60" value="'+esc(st.name)+'" placeholder="Por ejemplo, Lucía Martín Gil" required></div>'+
 (st.err?'<p class="err">'+esc(st.err)+'</p>':'')+
 '<button class="btn red" type="submit">Entrar</button><p style="font-size:14px">Tu nombre aparecerá en el certificado que entregarás a tu profesor.</p></form></main>'}

/* ---------- inicio y carrusel ---------- */
function buildFeat(){var rounds=[];D.asignaturas.forEach(function(s){var l=porAsig(s.id);if(l.length)rounds.push(l[Math.floor(Math.random()*l.length)])});st.feat=rounds;st.hero=Math.floor(Math.random()*rounds.length)}
function heroInner(){var c=st.feat[st.hero],s=sub(c.asignatura);
 return '<div class="bgart" aria-hidden="true">'+img(c.portada,"")+'</div><div class="wrap slide" key="'+c.id+'"><div class="txt"><span class="top10">'+LENS.replace('class="lens"','class="lens" style="width:26px;height:26px;color:var(--acc)"')+' Caso destacado</span><h1 class="disp">'+esc(c.titulo)+'</h1><div class="meta"><span class="chip c" style="background:'+s.color+'">'+esc(s.nombre)+'</span><span>'+esc(c.epoca)+'</span>'+(c.idioma==="en"?'<span class="lang-en">EN</span>':'')+(isDone(c.id)?'<span class="done">✓ Resuelto</span>':'')+'</div><p>'+esc(c.resumen)+'</p><div class="acts"><button class="btn" data-a="start" data-id="'+c.id+'">'+PLAY+'Empezar</button><button class="btn ghost" data-a="detail" data-id="'+c.id+'">Más información</button></div>'+
 '<div class="dots'+(heroPaused?' paused':'')+'" style="--dur:'+HERO_SEGUNDOS+'s" role="tablist" aria-label="Casos destacados">'+st.feat.map(function(f,i){return '<button role="tab" aria-label="'+esc(f.titulo)+'" aria-current="'+(i===st.hero)+'" data-a="hero" data-i="'+i+'"></button>'}).join('')+'</div></div><div class="poster">'+pw(c)+'</div></div><button class="harr l" data-a="heroprev" aria-label="Caso destacado anterior">'+ARR_L+'</button><button class="harr r" data-a="heronext" aria-label="Caso destacado siguiente">'+ARR_R+'</button>'}
var heroTimer=null,heroPaused=false;
function startHero(){stopHero();heroTimer=setInterval(function(){if(heroPaused||st.detail||st.screen!=="home")return;st.hero=(st.hero+1)%st.feat.length;paintHero()},HERO_SEGUNDOS*1000)}
function stopHero(){if(heroTimer)clearInterval(heroTimer);heroTimer=null}
function paintHero(){var el=document.getElementById("hero");if(el)el.innerHTML=heroInner()}
function row(inner){return '<div class="rowwrap"><button class="arr l" data-a="scroll" data-d="-1" aria-label="Ver casos anteriores">'+ARR_L+'</button><div class="track">'+inner+'</div><button class="arr r" data-a="scroll" data-d="1" aria-label="Ver más casos">'+ARR_R+'</button></div>'}
function updArrows(){[].forEach.call(app.querySelectorAll(".rowwrap"),function(w){var t=w.querySelector(".track"),max=t.scrollWidth-t.clientWidth-2;w.querySelector(".arr.l").disabled=t.scrollLeft<=2;w.querySelector(".arr.r").disabled=t.scrollLeft>=max})}
function home(){var h=topbar();
 h+='<section class="hero" id="hero">'+heroInner()+'</section>';
 h+='<div class="wrap"><section class="sec"><h2>Asignaturas</h2><div class="tiles">';
 D.asignaturas.forEach(function(s){h+='<button class="tile" data-a="sub" data-s="'+s.id+'">'+img(s.imagen,"")+'<span>'+esc(s.nombre)+'</span><small>'+porAsig(s.id).length+' casos</small></button>'});
 h+='</div></section>';
 var dl=doneList().map(caso).filter(Boolean);if(dl.length)h+='<section class="sec"><h2>Ya resueltos por '+esc(st.name.split(" ")[0])+'</h2>'+row(dl.map(function(c){return posterCard(c)}).join(''))+'></section>';
 D.asignaturas.forEach(function(s){h+='<section class="sec"><h2>'+esc(s.nombre)+' <button data-a="sub" data-s="'+s.id+'">Ver todos ›</button></h2>'+row(porAsig(s.id).map(function(c){return posterCard(c)}).join(''))+'></section>'});
 return h+'<footer class="foot">Proyecto Sherlock · Los personajes de los casos son ficticios salvo que el propio caso indique lo contrario; el contexto histórico, artístico y científico es real. El progreso se guarda en este navegador.</footer></div>'}

function subPage(){var s=sub(st.sub),list=porAsig(s.id);
 return topbar()+'<div class="wrap"><section class="subhead"><span class="eyebrow" style="color:'+s.color+'">Asignatura</span><h1 class="disp">'+esc(s.nombre)+'</h1><p>'+esc(s.descripcion)+'</p></section><div class="grid">'+list.map(function(c){return posterCard(c,true)}).join('')+'</div></div>'}

function detail(){var c=caso(st.detail),s=sub(c.asignatura),d=isDone(c.id);
 return '<div class="modal-bg" data-a="closebg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><button class="x" data-a="closemodal" aria-label="Cerrar">×</button><div class="mtop">'+img(c.portada,"Portada de "+c.titulo)+'<div class="mtxt"><span class="chip c" style="background:'+s.color+';align-self:flex-start">'+esc(s.nombre)+'</span><h2 class="disp" id="mt">'+esc(c.titulo)+'</h2><p>'+esc(c.resumen)+'</p><p style="font-family:var(--read);font-style:italic;color:var(--mut)">'+esc(c.mision)+'</p><div class="acts"><button class="btn red" data-a="start" data-id="'+c.id+'">'+PLAY+(d?'Volver a jugar':'Empezar caso')+'</button></div></div></div>'+
 '<div class="mfoot"><div><b>Época</b>'+esc(c.epoca)+'</div><div><b>Investigación</b>'+c.sospechosos.length+' '+esc(c.nombre_sospechosos)+' · '+c.pistas.length+' pistas</div><div><b>Estado</b>'+(d?'<span class="done">✓ Resuelto</span>':'Sin resolver')+'</div></div></div></div>'}

/* ---------- pantalla de carga ---------- */
function loader(c,done){var s=sub(c.asignatura),el=document.createElement("div"),letters="",d=.35,frases=c.idioma==="en"?["Opening the case file…","Gathering the clues…","Calling the suspects…","Ready. Good luck, detective!"]:["Abriendo el expediente…","Ordenando las pistas…","Llamando a los "+c.nombre_sospechosos+"…","Todo listo. Suerte, detective."];
 c.titulo.toUpperCase().split(" ").forEach(function(wd){letters+='<b class="wd">'+wd.split("").map(function(ch){return '<span style="animation-delay:'+(d+=.045).toFixed(2)+'s">'+esc(ch)+'</span>'}).join("")+'</b> '});
 var row=c.sospechosos.map(function(p,i){return '<img src="'+esc(ver(p.imagen))+'" alt="" style="animation-delay:'+(1.3+i*.18).toFixed(2)+'s">'}).join('');
 el.className="loader";el.style.setProperty("--sc",s.color);el.setAttribute("role","dialog");el.setAttribute("aria-label","Cargando el caso "+c.titulo);
 el.innerHTML='<div class="lbg" aria-hidden="true">'+img(c.portada,"")+'</div><div class="ring"></div><div class="ring r2"></div><div class="ring r3"></div>'+LUPA+'<button class="skip" type="button">Saltar ›</button><div class="lin"><span class="chip c" style="background:'+s.color+'">'+esc(s.nombre)+' · '+esc(c.epoca)+'</span><h2>'+letters+'</h2><div class="row">'+row+'</div><div class="status" aria-live="polite"></div><div class="bar"><i></i></div></div>';
 document.body.appendChild(el);
 var stEl=el.querySelector(".status"),tms=[],fin=false;
 frases.forEach(function(f,i){tms.push(setTimeout(function(){stEl.textContent=f},i*(CARGA_MS/frases.length)))});
 function end(){if(fin)return;fin=true;tms.forEach(clearTimeout);document.removeEventListener("keydown",key);el.classList.add("out");done();setTimeout(function(){el.remove()},480)}
 function key(e){if(e.key==="Escape"||e.key==="Enter")end()}
 document.addEventListener("keydown",key);el.querySelector(".skip").addEventListener("click",end);el.querySelector(".skip").focus();
 tms.push(setTimeout(end,CARGA_MS+300))}

/* ---------- lectura del caso ---------- */
function introView(){var c=caso(st.ci),s=sub(c.asignatura),en=c.idioma==="en";
 return topbar()+'<div class="readbar" aria-hidden="true"><i id="readfill" style="background:'+s.color+'"></i></div><button class="floatcue" data-a="scrollread" aria-label="Bajar para leer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="wrap" style="--case:'+s.color+'"><article class="read" lang="'+(en?"en":"es")+'"><button class="back" data-a="sub" data-s="'+c.asignatura+'">‹ Volver a '+esc(s.nombre)+'</button><span class="eyebrow" style="color:'+s.color+'">'+esc(s.nombre)+' · '+esc(c.epoca)+'</span><h1 class="disp">'+esc(c.titulo)+'</h1><div class="banner">'+img(c.escena,"")+'</div><button class="cue" data-a="scrollread" aria-label="Bajar para leer la historia"><span>'+(en?"Scroll down and read the story":"Sigue bajando y lee la historia")+'</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="lead" id="lead">'+c.introduccion.map(function(p){return '<p>'+esc(p)+'</p>'}).join('')+'</div><p class="mission">'+esc(c.mision)+'</p><button class="btn red" data-a="go" style="align-self:flex-start">Empezar la investigación</button></article></div>'}

function isOut(i){return st.out.indexOf(i)>-1}
function board(){var c=caso(st.ci),s=sub(c.asignatura),n=c.sospechosos.length,alive=n-st.out.length,en=c.idioma==="en",h=topbar();
 h+='<div class="wrap" style="--case:'+s.color+'"><section class="board"><div><span class="eyebrow" style="color:'+s.color+'">'+esc(s.nombre)+' · Investigación en curso</span><h1 class="disp">'+esc(c.titulo)+'</h1></div>';
 h+='<div class="dock"><div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="'+(st.tab==="sos")+'" data-a="tab" data-t="sos">'+esc(cap(c.nombre_sospechosos))+'<small>'+alive+' de '+n+' sin descartar</small></button><button class="tab" role="tab" aria-selected="'+(st.tab==="pis")+'" data-a="tab" data-t="pis">'+(en?"Clues":"Pistas")+'<small>'+st.shown+' de '+c.pistas.length+' leídas</small></button></div>';
 if(st.tab==="pis")h+='<div class="strip">'+c.sospechosos.map(function(p,i){return '<button class="mini'+(isOut(i)?' out':'')+'" data-a="ficha" data-i="'+i+'" aria-label="Ficha de '+esc(p.nombre)+'">'+img(p.imagen,p.nombre)+'<span>'+esc(p.corto)+'</span></button>'}).join('')+'</div>';
 h+='</div>';
 if(st.tab==="sos"){h+='<div class="people">'+c.sospechosos.map(function(p,i){var o=isOut(i);return '<div class="pc'+(o?' out':'')+'"><div class="ph">'+img(p.imagen,p.nombre)+'<span class="stamp">Descartado</span></div><div class="pb"><div><div class="pn">'+esc(p.nombre)+'</div><div class="pr">'+esc(p.descripcion)+'</div></div><div class="pa"><button class="sm info" data-a="ficha" data-i="'+i+'">Leer ficha</button><button class="sm" data-a="toggle" data-i="'+i+'">'+(o?'Recuperar':'Descartar')+'</button><button class="sm pick" data-a="pick" data-i="'+i+'"'+(o?' disabled':'')+'>Elegir</button></div></div></div>'}).join('')+'</div>'}
 else{
  h+='<p class="note">Toca una imagen para abrir su ficha, descartarla o elegirla.</p>';
  h+=st.shown<c.pistas.length?'<button class="btn ghost" data-a="clue" style="align-self:flex-start">Leer la siguiente pista ('+(st.shown+1)+' de '+c.pistas.length+')</button>':'<p class="note">Ya has leído todas las pistas. Te toca decidir.</p>';
  h+='<div class="clues" lang="'+(en?"en":"es")+'">';for(var k=st.shown-1;k>=0;k--){var d=c.pistas[k];h+='<article class="clue'+(st.fresh&&k===st.shown-1?' fresh':'')+'">'+(k===st.shown-1&&st.shown>1?'<span class="newtag">'+(en?"New clue":"Pista nueva")+'</span>':'')+'<div class="ch"><div><h3>'+esc(d.titulo)+'</h3><div class="src">'+esc(d.fuente)+'</div></div><span class="num">'+(k+1)+'</span></div><p>'+esc(d.texto)+'</p></article>'}
  h+='</div><details class="reread"><summary>Releer el planteamiento del caso</summary>'+c.introduccion.map(function(p){return '<p>'+esc(p)+'</p>'}).join('')+'</details>'}
 h+='</section></div>';
 if(st.dossier!==null&&st.pick===null){var p=c.sospechosos[st.dossier],o=isOut(st.dossier);
  h+='<div class="modal-bg" data-a="closebg"><div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" lang="'+(en?"en":"es")+'"><button class="x" data-a="closemodal" aria-label="Cerrar">×</button><div class="row">'+img(p.imagen,p.nombre)+'<div><span class="eyebrow">'+(en?"Profile":"Ficha")+'</span><h3 id="dt">'+esc(p.nombre)+'</h3><p class="note">'+esc(p.descripcion)+'</p></div></div><dl>'+p.ficha.map(function(x){return '<div><dt>'+esc(x.titulo)+'</dt><dd>'+esc(x.texto)+'</dd></div>'}).join('')+'</dl><div class="two" lang="es"><button class="btn ghost" data-a="toggle" data-i="'+st.dossier+'">'+(o?'Recuperar':'Descartar')+'</button><button class="btn red" data-a="pick" data-i="'+st.dossier+'"'+(o?' disabled':'')+'>Elegir</button></div></div></div>'}
 if(st.pick!==null){var q=c.sospechosos[st.pick];
  h+='<div class="modal-bg"><div class="dlg" role="dialog" aria-modal="true" aria-labelledby="ct"><div class="row">'+img(q.imagen,q.nombre)+'<div><span class="eyebrow">Tu elección</span><h3 id="ct">'+esc(q.nombre)+'</h3></div></div><p>'+esc(c.confirmacion||"¿Estás seguro?")+'</p><p>Si te equivocas, tendrás que empezar el caso de nuevo.</p><div class="two"><button class="btn ghost" data-a="cancel">Seguir leyendo</button><button class="btn red" data-a="confirm">Confirmar</button></div></div></div>'}
 return h}

function result(){var c=caso(st.ci),s=sub(c.asignatura),r=st.result,en=c.idioma==="en",h=topbar();
 h+=(st.flash?'<div class="flash '+st.flash+'" aria-hidden="true"></div>':'');
 if(r.win){var p=c.sospechosos[ans(c)];
  h+='<div class="wrap" style="--case:'+s.color+'"><section class="res"><span class="eyebrow" style="color:'+s.color+'">'+esc(s.nombre)+' · '+esc(c.titulo)+'</span><div class="verdict win">Misterio resuelto</div><div class="who">'+img(p.imagen,p.nombre)+'<div><span class="eyebrow">La respuesta era</span><div class="disp" style="font-size:40px">'+esc(p.nombre)+'</div><p class="note">Pistas leídas: '+st.shown+' de '+c.pistas.length+' · Intentos: '+(st.tries+1)+'</p></div></div><p class="body" lang="'+(en?"en":"es")+'">'+esc(c.final)+'</p><div class="facts" lang="'+(en?"en":"es")+'"><h3>'+(en?"Did you know?":"Para saber más")+'</h3><ul>'+c.saber_mas.map(function(f){return '<li>'+esc(f)+'</li>'}).join('')+'</ul></div>'+
  '<div class="cert"><p>Descarga tu certificado en PDF con tu nombre, el resumen del caso y una pregunta para responder. Entrégaselo a tu profesor.</p><button class="btn red" data-a="pdf" id="pdfbtn">Descargar certificado (PDF)</button></div><div class="cert quizcta"><p><b>Cuestionario final.</b> '+(c.cuestionario||[]).length+' preguntas para pensar, opinar y escribir. Se hace en pantalla completa y cada respuesta necesita al menos '+MIN_PALABRAS+' palabras. Si sales antes de terminar, se borrarán tus respuestas.</p><button class="btn" data-a="quiz">Hacer el cuestionario</button></div><div class="acts"><button class="btn ghost" data-a="sub" data-s="'+c.asignatura+'">Más casos de '+esc(s.nombre)+'</button><button class="btn ghost" data-a="home">Inicio</button></div></section></div>'}
 else{var w=c.sospechosos[r.pick];
  h+='<div class="wrap"><section class="res"><span class="eyebrow">'+esc(c.titulo)+'</span><div class="verdict lose">Respuesta equivocada</div><div class="who">'+img(w.imagen,w.nombre)+'<div><span class="eyebrow">Elegiste</span><div class="disp" style="font-size:40px">'+esc(w.nombre)+'</div></div></div><p class="body">'+esc(w.nombre)+' no es la respuesta: alguna de las pistas que has leído, o de las que te faltan, no encaja con su ficha. Vuelve a empezar y lee cada pista despacio, buscando el dato concreto que permite descartar a alguien.</p><div class="acts"><button class="btn red" data-a="retry">Volver a intentarlo</button><button class="btn ghost" data-a="sub" data-s="'+c.asignatura+'">Elegir otro caso</button></div></section></div>'}
 return h}


function helpView(){return '<div class="modal-bg" data-a="closebg"><div class="dlg helpdlg" role="dialog" aria-modal="true" aria-labelledby="hlp"><button class="x" data-a="closemodal" aria-label="Cerrar">×</button><div class="row">'+LENS+'<div><span class="eyebrow">Ayuda</span><h3 id="hlp">Cómo se juega</h3></div></div><ol class="howto"><li><b>Elige un caso</b> de cualquier asignatura y lee la introducción con calma: ahí se plantea el misterio.</li><li>En cada caso hay <b>seis sospechosos</b> (o seis candidatos) y <b>solo una respuesta correcta</b>.</li><li>Abre la <b>ficha</b> de cada uno: contiene los datos que tendrás que cruzar con las pistas.</li><li>Lee las <b>pistas</b> de una en una. Cada pista permite descartar a uno solo, pero casi nunca dice su nombre: tienes que relacionarla con las fichas.</li><li>Usa <b>Descartar</b> para ir apartando a quien no puede ser. Si te equivocas, puedes recuperarlo.</li><li>Cuando lo tengas claro, pulsa <b>Elegir</b>. Si aciertas, podrás descargar tu <b>certificado en PDF</b>; si fallas, podrás volver a intentarlo.</li></ol><button class="btn red" data-a="closemodal">Entendido</button></div></div>'}

/* ---------- render y navegación ---------- */
function render(){var h;
 if(st.screen==="gate")h=gate();else if(st.screen==="home")h=home();else if(st.screen==="sub")h=subPage();else if(st.screen==="intro")h=introView();else if(st.screen==="board")h=board();else h=result();
 if(st.detail&&(st.screen==="home"||st.screen==="sub"))h+=detail();
 if(st.help)h+=helpView();
 app.innerHTML=h;st.fresh=false;st.flash=null;
 if(st.screen==="home")startHero();else stopHero();
 [].forEach.call(app.querySelectorAll(".track"),function(t){t.addEventListener("scroll",updArrows,{passive:true})});updArrows();
 var f=document.getElementById("gateform");if(f){f.addEventListener("submit",onGate);var i=document.getElementById("nm");if(i&&!st.name)i.focus()}
 var x=app.querySelector(".modal-bg [data-a=confirm]")||app.querySelector(".modal-bg .x");if(x)x.focus()}
function go(scr){st.screen=scr;st.help=false;st.detail=null;st.dossier=null;st.pick=null;render();window.scrollTo(0,0)}
function onGate(e){e.preventDefault();var n=document.getElementById("nm").value.trim().replace(/\s+/g," ");
 if(n.split(" ").length<2||n.length<5){st.err="Escribe tu nombre y al menos un apellido.";render();document.getElementById("nm").value=n;return}
 st.err="";st.name=n;lsSet("sherlock-nombre",n);go("home")}
function toDock(){var d=app.querySelector(".dock");if(!d)return;var y=d.getBoundingClientRect().top+window.scrollY-70;if(window.scrollY>y)window.scrollTo(0,y)}
function startCase(id){var c=caso(id);st.detail=null;stopHero();loader(c,function(){st.ci=id;st.shown=1;st.out=[];st.tab="pis";st.tries=0;go("intro")})}

app.addEventListener("click",function(e){var b=e.target.closest("[data-a]");if(!b||b.disabled)return;var a=b.getAttribute("data-a"),i=parseInt(b.getAttribute("data-i"),10),c=st.ci?caso(st.ci):null;
 if(a==="closebg"){if(e.target===b){st.detail=null;st.dossier=null;st.help=false;render()}return}
 if(a==="home")go("home");
 else if(a==="sub"){st.sub=b.getAttribute("data-s");go("sub")}
 else if(a==="logout"){st.name="";st.err="";lsSet("sherlock-nombre","");go("gate")}
 else if(a==="detail"){st.detail=b.getAttribute("data-id");render()}
 else if(a==="closemodal"){st.detail=null;st.dossier=null;st.help=false;render()}
 else if(a==="help"){st.help=true;render()}
 else if(a==="scrollread"){var L=document.getElementById("lead");if(L)window.scrollTo({top:L.getBoundingClientRect().top+window.scrollY-90,behavior:"smooth"})}
 else if(a==="heroprev"||a==="heronext"){st.hero=(st.hero+(a==="heronext"?1:-1)+st.feat.length)%st.feat.length;paintHero();startHero()}
 else if(a==="scroll"){var t=b.parentNode.querySelector(".track");t.scrollBy({left:(+b.getAttribute("data-d"))*t.clientWidth*0.85,behavior:"smooth"})}
 else if(a==="quiz")Quiz.open(c);
 else if(a==="hero"){st.hero=i;paintHero();startHero()}
 else if(a==="start")startCase(b.getAttribute("data-id"));
 else if(a==="go"){st.shown=1;st.out=[];st.tab="pis";st.fresh=true;go("board")}
 else if(a==="tab"){st.tab=b.getAttribute("data-t");render();toDock()}
 else if(a==="ficha"){st.dossier=i;render()}
 else if(a==="toggle"){var k=st.out.indexOf(i);if(k>-1)st.out.splice(k,1);else st.out.push(i);render()}
 else if(a==="pick"){st.pick=i;render()}
 else if(a==="cancel"){st.pick=null;render()}
 else if(a==="clue"){st.shown=Math.min(st.shown+1,c.pistas.length);st.fresh=true;render();toDock()}
 else if(a==="confirm"){var win=st.pick===ans(c);st.result={win:win,pick:st.pick};st.flash=win?"win":"lose";
  if(win){var dl=doneList();if(dl.indexOf(c.id)<0)dl.push(c.id);lsSet(doneKey(),dl)}
  st.screen="result";st.dossier=null;st.pick=null;render();window.scrollTo(0,0)}
 else if(a==="retry"){st.tries++;st.shown=1;st.out=[];st.tab="pis";st.fresh=true;go("board")}
 else if(a==="pdf")makePDF(c,b);
});
app.addEventListener("mouseover",function(e){if(e.target.closest&&e.target.closest("#hero .txt, #hero .poster")){if(!heroPaused){heroPaused=true;var d=app.querySelector("#hero .dots");if(d)d.classList.add("paused")}}});
app.addEventListener("mouseout",function(e){var h=document.getElementById("hero");if(heroPaused&&h&&!h.contains(e.relatedTarget)){heroPaused=false;var d=app.querySelector("#hero .dots");if(d)d.classList.remove("paused")}});
document.addEventListener("keydown",function(e){if(e.key==="Escape"){if(document.querySelector(".loader")||document.querySelector(".quiz"))return;if(st.help)st.help=false;else if(st.pick!==null)st.pick=null;else if(st.dossier!==null)st.dossier=null;else if(st.detail)st.detail=null;else return;render()}});

window.addEventListener("scroll",function(){var f=document.getElementById("readfill");if(!f)return;var d=document.documentElement,max=d.scrollHeight-window.innerHeight,p=max>0?Math.min(1,window.scrollY/max):1;f.style.transform="scaleX("+p+")";var fc=app.querySelector(".floatcue");if(fc)fc.classList.toggle("gone",window.scrollY>140)},{passive:true});

/* ---------- certificado PDF ---------- */
function clean(t){return String(t).replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/—|–/g,"-").replace(/…/g,"...").replace(/[^\x00-\xFF]/g,"")}
function toPNG(src,w,h,contain){return new Promise(function(res){var im=new Image();im.onload=function(){try{var cv=document.createElement("canvas");cv.width=w;cv.height=h;var x=cv.getContext("2d"),r=(contain?Math.min(w/im.width,h/im.height):Math.max(w/im.width,h/im.height))||1,iw=im.width*r,ih=im.height*r;x.drawImage(im,(w-iw)/2,(h-ih)/2,iw,ih);res(cv.toDataURL("image/png"))}catch(e){res(null)}};im.onerror=function(){res(null)};im.src=src})}
function hsh(str){var h=7;for(var i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))%2147483647;return h}
function codigo(c){var d=new Date(),k=st.name.toLowerCase()+"|"+c.id+"|"+d.toISOString().slice(0,10)+"|"+st.shown+"|"+st.tries;return(hsh(k)%2176782336).toString(36).toUpperCase().padStart(6,"0")}
function rgb(h){var n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]}
function makePDF(c,btn){if(!window.jspdf){toast("No se ha podido cargar el generador de PDF. Comprueba la conexión a internet.");return}
 btn.disabled=true;btn.textContent="Preparando PDF...";
 var s=sub(c.asignatura),col=rgb(s.color),p=c.sospechosos[ans(c)];
 Promise.all([toPNG(c.portada,400,600),toPNG(p.imagen,240,300),toPNG(LOGO,300,300,true)]).then(function(im){
  var J=new window.jspdf.jsPDF({unit:"mm",format:"a4"}),W=210,M=18,y;
  function head(){J.setFillColor(12,12,14);J.rect(0,0,W,24,"F");if(im[2])J.addImage(im[2],"PNG",M-1,3.5,17,17);else{J.setDrawColor(229,64,58);J.setLineWidth(1.4);J.circle(M+4.5,11,3.6);J.line(M+7.2,13.7,M+10,16.5)}J.setTextColor(255);J.setFont("helvetica","bold");J.setFontSize(15);J.text("PROYECTO SHERLOCK",M+20,12.5);J.setFont("helvetica","normal");J.setFontSize(8);J.setTextColor(200);J.text("LEE, RAZONA Y RESUELVE EL MISTERIO  ·  Certificado de lectura",M+20,18);J.setFillColor(col[0],col[1],col[2]);J.rect(0,24,W,1.6,"F")}
  function need(h){if(y+h>282){J.addPage();head();y=36}}
  function para(t,size,style,color,lh){J.setFont("helvetica",style||"normal");J.setFontSize(size);J.setTextColor.apply(J,color||[33,29,24]);J.splitTextToSize(clean(t),W-2*M).forEach(function(l){need(lh);J.text(l,M,y);y+=lh})}
  function h2(t){need(14);y+=3;J.setFont("helvetica","bold");J.setFontSize(12);J.setTextColor(Math.round(col[0]*.6),Math.round(col[1]*.6),Math.round(col[2]*.6));J.text(clean(t.toUpperCase()),M,y);y+=2;J.setDrawColor(col[0],col[1],col[2]);J.setLineWidth(.5);J.line(M,y,M+25,y);y+=6}
  head();
  if(im[0])J.addImage(im[0],"PNG",M,34,52,78);
  var x=M+60;J.setTextColor(110);J.setFont("helvetica","bold");J.setFontSize(9);J.text(clean(s.nombre.toUpperCase()+"  ·  "+c.epoca.toUpperCase()),x,40);
  J.setTextColor(20);J.setFontSize(22);var tl=J.splitTextToSize(clean(c.titulo),W-x-M);J.text(tl,x,50);var yy=50+tl.length*9;
  J.setFont("helvetica","normal");J.setFontSize(10.5);J.setTextColor(60);var rs=J.splitTextToSize(clean(c.resumen),W-x-M);J.text(rs,x,yy);yy+=rs.length*5+6;
  J.setFillColor(246,242,233);J.roundedRect(x,yy,W-x-M,28,2,2,"F");
  J.setFontSize(8.5);J.setTextColor(110);J.setFont("helvetica","bold");J.text("ALUMNO/A",x+5,yy+7);J.text("FECHA",x+5,yy+20);
  J.setFontSize(13);J.setTextColor(20);J.text(clean(st.name),x+5,yy+13.5);J.setFontSize(10.5);J.setFont("helvetica","normal");
  var d=new Date();J.text(d.toLocaleDateString("es-ES")+"  "+d.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),x+5,yy+25.5);
  y=Math.max(122,yy+40);
  J.setFillColor(col[0],col[1],col[2]);J.roundedRect(M,y-6,W-2*M,16,2,2,"F");J.setTextColor(15);J.setFont("helvetica","bold");J.setFontSize(11);
  J.text(clean("CASO RESUELTO  ·  Pistas leidas: "+st.shown+" de "+c.pistas.length+"  ·  Intentos: "+(st.tries+1)+"  ·  Codigo: "+codigo(c)),M+5,y+4);y+=20;
  h2(c.idioma==="en"?"The case":"El caso");c.introduccion.forEach(function(t){para(t,10.5,"normal",null,5.2);y+=2});
  h2(c.idioma==="en"?"The solution":"La solucion");
  if(im[1]){need(34);J.addImage(im[1],"PNG",M,y-2,24,30);J.setFont("helvetica","bold");J.setFontSize(14);J.setTextColor(20);J.text(clean(p.nombre),M+30,y+8);J.setFont("helvetica","normal");J.setFontSize(10);J.setTextColor(90);J.text(J.splitTextToSize(clean(p.descripcion),W-2*M-30),M+30,y+14);y+=34}
  para(c.final,10.5,"normal",null,5.2);
  h2(c.idioma==="en"?"Did you know?":"Para saber mas");c.saber_mas.forEach(function(f){var L=J.splitTextToSize(clean(f),W-2*M-6);need(L.length*5.2+2);J.setFont("helvetica","normal");J.setFontSize(10.5);J.setTextColor(33);J.text("-",M,y);J.text(L,M+5,y);y+=L.length*5.2+2});
  h2("Pregunta para responder a mano");para(c.pregunta,11,"bold",[33,29,24],5.6);y+=3;
  for(var i=0;i<8;i++){need(9);J.setDrawColor(200);J.setLineWidth(.3);J.line(M,y+4,W-M,y+4);y+=9}
  var n=J.getNumberOfPages();for(var k=1;k<=n;k++){J.setPage(k);J.setFontSize(8);J.setTextColor(140);J.setFont("helvetica","normal");J.text(clean("Proyecto Sherlock · "+c.titulo+" · "+st.name+" · pagina "+k+" de "+n),W/2,290,{align:"center"})}
  J.save(("sherlock-"+c.id+"-"+st.name).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-")+".pdf");
  btn.disabled=false;btn.textContent="Descargar de nuevo";toast("Certificado descargado");
 }).catch(function(){btn.disabled=false;btn.textContent="Descargar certificado (PDF)";toast("No se ha podido crear el PDF.")})}
function toast(t){var d=document.createElement("div");d.className="toast";d.setAttribute("role","status");d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},2600)}

/* ---------- cuestionario final (pantalla completa) ---------- */
var Quiz=(function(){
 var el=null,c=null,ans=[],salidas=0,done=false,fs=false,warnEl=null,timer=null,t0=0,blurAt=0,blurTimer=null;
 function words(t){var m=String(t).trim().match(/[^\s]+/g);return m?m.length:0}
 function en(){return c&&c.idioma==="en"}
 function L(es,eng){return en()?eng:es}
 function open(caso){if(el)return;c=caso;ans=(c.cuestionario||[]).map(function(){return ""});salidas=0;done=false;t0=Date.now();
  el=document.createElement("div");el.className="quiz";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label",L("Cuestionario","Questionnaire"));
  document.body.appendChild(el);document.body.classList.add("noscroll");paint();
  var r=el.requestFullscreen?el.requestFullscreen():null;fs=!!r;
  if(r&&r.catch)r.catch(function(){fs=false});
  document.addEventListener("fullscreenchange",onFS);document.addEventListener("visibilitychange",onVis);window.addEventListener("blur",onBlur);window.addEventListener("focus",onFocus);window.addEventListener("beforeunload",onUnload);
  var f=el.querySelector("textarea");if(f)f.focus()}
 function head(){var s=sub(c.asignatura);return '<header class="qhead"><div class="qbrand">'+LENS+'<div><b>'+esc(L("Cuestionario","Questionnaire"))+' · '+esc(c.titulo)+'</b><small>'+esc(st.name)+' · '+esc(s.nombre)+'</small></div></div><div class="qprog" id="qprog"></div><button class="btn ghost qexit" data-q="exit">'+(done?L("Cerrar","Close"):L("Salir","Leave"))+'</button></header>'}
 function paint(){var h=head();
  if(!done){h+='<main class="qbody"><p class="qintro">'+esc(L("Responde a las "+ans.length+" preguntas con tus propias palabras. Cada respuesta debe tener al menos "+MIN_PALABRAS+" palabras. No se puede pegar texto. Si sales de la pantalla completa o cambias de pestaña, se borrarán tus respuestas.","Answer the "+ans.length+" questions in your own words. Each answer must have at least "+MIN_PALABRAS+" words. You can't paste text. If you leave full screen or change tab, your answers will be deleted."))+'</p>';
   c.cuestionario.forEach(function(q,i){h+='<section class="qitem"><label for="qa'+i+'"><span class="qn">'+(i+1)+'</span><span>'+esc(q)+'</span></label><textarea id="qa'+i+'" data-i="'+i+'" rows="6" spellcheck="true" autocomplete="off" placeholder="'+esc(L("Escribe aquí tu respuesta…","Write your answer here…"))+'">'+esc(ans[i])+'</textarea><div class="qcount" id="qc'+i+'"></div></section>'});
   h+='<div class="qsend"><p id="qmiss"></p><button class="btn red" data-q="send" id="qsendbtn">'+esc(L("Entregar cuestionario","Hand in"))+'</button></div></main>'}
  else{h+='<main class="qbody qdone"><div class="verdict win" style="font-size:clamp(44px,8vw,80px)">'+esc(L("Cuestionario entregado","Questionnaire completed"))+'</div><p class="qintro">'+esc(L("¡Muy bien! Has respondido a todas las preguntas. Descarga el PDF con tus respuestas y entrégaselo a tu profesor.","Well done! You have answered all the questions. Download the PDF with your answers and give it to your teacher."))+'</p><p class="note">'+esc(L("Palabras escritas: ","Words written: "))+ans.reduce(function(a,t){return a+words(t)},0)+'</p><div class="acts"><button class="btn red" data-q="pdf">'+esc(L("Descargar respuestas (PDF)","Download answers (PDF)"))+'</button><button class="btn ghost" data-q="exit">'+esc(L("Cerrar","Close"))+'</button></div></main>'}
  el.innerHTML=h;wire();upd()}
 function wire(){
  el.onclick=function(e){var b=e.target.closest("[data-q]");if(!b)return;var a=b.getAttribute("data-q");
   if(a==="send")send();else if(a==="pdf")pdf(b);else if(a==="exit"){if(done)close();else warn("exit")}
   else if(a==="back")back();else if(a==="wipe")wipe(L("Has salido del cuestionario. Tus respuestas se han borrado.","You left the questionnaire. Your answers have been deleted."))};
  [].forEach.call(el.querySelectorAll("textarea"),function(t){
   t.addEventListener("input",function(){ans[+t.getAttribute("data-i")]=t.value;upd()});
   t.addEventListener("paste",function(e){e.preventDefault();toast(L("En el cuestionario no se puede pegar texto.","You can't paste text in the questionnaire."))});
   t.addEventListener("drop",function(e){e.preventDefault()})})}
 function upd(){if(done||!el)return;var ok=0;ans.forEach(function(t,i){var n=words(t),d=el.querySelector("#qc"+i);if(n>=MIN_PALABRAS)ok++;if(d){d.textContent=n+" "+L("palabras","words")+" · "+L("mínimo ","minimum ")+MIN_PALABRAS;d.className="qcount"+(n>=MIN_PALABRAS?" ok":"")}});
  var p=el.querySelector("#qprog");if(p)p.innerHTML='<span>'+ok+'/'+ans.length+'</span><i style="width:'+(ok/ans.length*100)+'%"></i>';
  var m=el.querySelector("#qmiss"),b=el.querySelector("#qsendbtn");if(b)b.disabled=ok<ans.length;
  if(m)m.textContent=ok<ans.length?L("Te faltan "+(ans.length-ok)+" respuestas por completar (mínimo "+MIN_PALABRAS+" palabras cada una).","You still have "+(ans.length-ok)+" answers to complete (minimum "+MIN_PALABRAS+" words each)."):L("¡Todo listo! Ya puedes entregar el cuestionario.","All done! You can hand in the questionnaire now.")}
 function send(){if(ans.some(function(t){return words(t)<MIN_PALABRAS}))return;done=true;clearWarn();paint();el.scrollTop=0}
 function warn(kind){if(done||!el)return;clearWarn();var secs=kind==="fs"?20:0;
  var msg=kind==="exit"?L("Si sales ahora, se borrarán todas tus respuestas y tendrás que empezar el cuestionario desde el principio.","If you leave now, all your answers will be deleted and you will have to start again."):
   kind==="fs"?L("Has salido de la pantalla completa. Si no vuelves al cuestionario, se borrarán todas tus respuestas.","You left full screen. If you don't go back to the questionnaire, all your answers will be deleted."):
   L("Has salido de la página del cuestionario. Esta es tu única advertencia: si vuelves a salir, se borrarán todas tus respuestas.","You left the questionnaire page. This is your only warning: if you leave again, all your answers will be deleted.");
  warnEl=document.createElement("div");warnEl.className="qwarn";warnEl.setAttribute("role","alertdialog");
  warnEl.innerHTML='<div class="dlg"><span class="eyebrow" style="color:var(--acc2)">'+esc(L("Atención","Warning"))+'</span><h3>'+esc(L("¡Cuidado!","Be careful!"))+'</h3><p>'+esc(msg)+'</p>'+(secs?'<p class="note" id="qcd"></p>':'')+'<div class="two"><button class="btn red" data-q="back">'+esc(L("Volver al cuestionario","Back to the questionnaire"))+'</button><button class="btn ghost" data-q="wipe">'+esc(L("Salir y borrar todo","Leave and delete"))+'</button></div></div>';
  el.appendChild(warnEl);warnEl.querySelector("[data-q=back]").focus();
  if(secs){var left=secs,cd=warnEl.querySelector("#qcd");var tick=function(){if(cd)cd.textContent=L("Se borrará en "+left+" segundos.","Deleting in "+left+" seconds.");if(left--<=0)wipe(L("No has vuelto a la pantalla completa. Tus respuestas se han borrado.","You didn't go back to full screen. Your answers have been deleted."))};tick();timer=setInterval(tick,1000)}}
 function clearWarn(){if(timer)clearInterval(timer);timer=null;if(warnEl)warnEl.remove();warnEl=null}
 function back(){clearWarn();if(fs&&!document.fullscreenElement&&el.requestFullscreen){var r=el.requestFullscreen();if(r&&r.catch)r.catch(function(){})}}
 function onFS(){if(!el)return;if(!document.fullscreenElement&&fs&&!done)warn("fs")}
 function left(){if(done||!el)return;salidas++;if(salidas>AVISOS_SALIDA)wipe(L("Has vuelto a salir de la página del cuestionario. Tus respuestas se han borrado.","You left the questionnaire page again. Your answers have been deleted."));else warn("leave")}
 function onVis(){if(document.visibilityState==="hidden"){blurAt=0;if(blurTimer)clearTimeout(blurTimer);pendingLeave=true}else if(pendingLeave){pendingLeave=false;left()}}
 var pendingLeave=false;
 function onBlur(){if(done||!el)return;blurAt=Date.now();blurTimer=setTimeout(function(){if(blurAt&&!pendingLeave)pendingLeave=true},1500)}
 function onFocus(){if(blurTimer)clearTimeout(blurTimer);blurAt=0;if(pendingLeave&&document.visibilityState==="visible"){pendingLeave=false;left()}}
 function onUnload(e){if(el&&!done){e.preventDefault();e.returnValue="";return ""}}
 function wipe(msg){ans=ans.map(function(){return ""});close();toast(msg)}
 function close(){clearWarn();document.removeEventListener("fullscreenchange",onFS);document.removeEventListener("visibilitychange",onVis);window.removeEventListener("blur",onBlur);window.removeEventListener("focus",onFocus);window.removeEventListener("beforeunload",onUnload);
  pendingLeave=false;if(document.fullscreenElement&&document.exitFullscreen){var r=document.exitFullscreen();if(r&&r.catch)r.catch(function(){})}
  if(el)el.remove();el=null;document.body.classList.remove("noscroll")}
 function pdf(btn){if(!window.jspdf){toast(L("No se ha podido cargar el generador de PDF. Comprueba la conexión a internet.","The PDF generator could not be loaded. Check your internet connection."));return}
  btn.disabled=true;var s=sub(c.asignatura),col=rgb(s.color);
  toPNG(LOGO,300,300,true).then(function(logo){
   var J=new window.jspdf.jsPDF({unit:"mm",format:"a4"}),W=210,M=18,y;
   function head(){J.setFillColor(12,12,14);J.rect(0,0,W,24,"F");if(logo)J.addImage(logo,"PNG",M-1,3.5,17,17);J.setTextColor(255);J.setFont("helvetica","bold");J.setFontSize(15);J.text("PROYECTO SHERLOCK",M+20,12.5);J.setFont("helvetica","normal");J.setFontSize(8);J.setTextColor(200);J.text(clean(L("LEE, RAZONA Y RESUELVE EL MISTERIO  ·  Cuestionario final","READ, THINK AND SOLVE THE MYSTERY  ·  Final questionnaire")),M+20,18);J.setFillColor(col[0],col[1],col[2]);J.rect(0,24,W,1.6,"F")}
   function need(h){if(y+h>282){J.addPage();head();y=36}}
   head();y=36;
   J.setTextColor(110);J.setFont("helvetica","bold");J.setFontSize(9);J.text(clean(s.nombre.toUpperCase()+"  ·  "+c.epoca.toUpperCase()),M,y);y+=8;
   J.setTextColor(20);J.setFontSize(20);var tl=J.splitTextToSize(clean(c.titulo),W-2*M);J.text(tl,M,y);y+=tl.length*8+2;
   var d=new Date(),mins=Math.max(1,Math.round((Date.now()-t0)/60000)),tot=ans.reduce(function(a,t){return a+words(t)},0);
   J.setFillColor(246,242,233);J.roundedRect(M,y,W-2*M,22,2,2,"F");J.setFontSize(8.5);J.setTextColor(110);J.text(L("ALUMNO/A","STUDENT"),M+5,y+7);J.text(L("FECHA","DATE"),M+95,y+7);
   J.setFont("helvetica","bold");J.setFontSize(12);J.setTextColor(20);J.text(clean(st.name),M+5,y+14);J.setFont("helvetica","normal");J.setFontSize(10);J.text(d.toLocaleDateString("es-ES")+"  "+d.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),M+95,y+14);
   J.setFontSize(8.5);J.setTextColor(90);J.text(clean(L("Palabras: "+tot+"  ·  Tiempo: "+mins+" min  ·  Salidas de la página registradas: "+salidas,"Words: "+tot+"  ·  Time: "+mins+" min  ·  Times the student left the page: "+salidas)),M+5,y+19.5);y+=32;
   c.cuestionario.forEach(function(q,i){need(20);J.setFont("helvetica","bold");J.setFontSize(11);J.setTextColor(Math.round(col[0]*.55),Math.round(col[1]*.55),Math.round(col[2]*.55));
    var ql=J.splitTextToSize(clean((i+1)+". "+q),W-2*M);ql.forEach(function(l){need(6);J.text(l,M,y);y+=5.4});y+=1.5;
    J.setFont("helvetica","normal");J.setFontSize(10.5);J.setTextColor(33,29,24);
    String(ans[i]).split(/\n+/).forEach(function(par){J.splitTextToSize(clean(par.trim()),W-2*M-4).forEach(function(l){need(5.4);J.text(l,M+4,y);y+=5.2});y+=1.5});
    J.setFontSize(8);J.setTextColor(140);need(5);J.text(words(ans[i])+" "+L("palabras","words"),W-M,y,{align:"right"});y+=7});
   var n=J.getNumberOfPages();for(var k=1;k<=n;k++){J.setPage(k);J.setFontSize(8);J.setTextColor(140);J.setFont("helvetica","normal");J.text(clean("Proyecto Sherlock · "+c.titulo+" · "+st.name+" · "+L("página ","page ")+k+" / "+n),W/2,290,{align:"center"})}
   J.save(("sherlock-cuestionario-"+c.id+"-"+st.name).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-")+".pdf");
   btn.disabled=false;toast(L("Respuestas descargadas","Answers downloaded"))}).catch(function(){btn.disabled=false;toast(L("No se ha podido crear el PDF.","The PDF could not be created."))})}
 return {open:open}
})();

window.addEventListener("resize",function(){if(D)updArrows()});
/* ---------- arranque ---------- */
function fallo(){app.innerHTML='<div class="wrap"><div class="notice">'+LENS.replace('class="lens"','class="lens" style="width:48px;height:48px;color:var(--acc)"')+'<h1>No se han podido cargar los casos</h1><p>Proyecto Sherlock lee los casos del archivo <code>data/casos.json</code>. Por seguridad, los navegadores no dejan leer ese archivo si abres <code>index.html</code> con doble clic.</p><p>Súbelo a GitHub Pages o a la web de tu centro, o ábrelo con un servidor local (por ejemplo, la extensión Live Server de Visual Studio Code). Después entra desde la dirección <code>http://…</code></p></div></div>'}
fetch("data/casos.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(json){D=json;buildFeat();if(st.name)st.screen="home";render()}).catch(fallo);
})();
