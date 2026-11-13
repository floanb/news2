/* VitaScore — interfaz didáctica NEWS2. La lógica clínica permanece en news2.js. */
const RANGOS={fr:{min:0,max:80},spo2:{min:50,max:100},tas:{min:40,max:300},fc:{min:20,max:300},temp:{min:25,max:45}};
const NOMBRES_DETALLE={fr:'Frecuencia respiratoria',spo2:'SpO₂',oxigeno:'Oxígeno suplementario',tas:'Presión sistólica',fc:'Frecuencia cardiaca',conciencia:'Conciencia (ACVPU)',temp:'Temperatura'};
const CLAVE_HISTORIAL='news2-historial'; // Se mantiene para conservar registros de versiones anteriores.
let ultimoCalculo=null;
const $=id=>document.getElementById(id);
const escapar=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bienvenido=$('bienvenida'),app=$('aplicacion');
function cambiarVista(inicio){bienvenido.classList.toggle('oculto',!inicio);app.classList.toggle('oculto',inicio);window.scrollTo({top:0,behavior:'instant'});}
$('comenzar').addEventListener('click',()=>cambiarVista(false));
$('volver-inicio').addEventListener('click',()=>cambiarVista(true));
document.querySelectorAll('.segmentos').forEach(grupo=>{
  grupo.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;grupo.querySelectorAll('button').forEach(el=>{el.classList.remove('activo');el.setAttribute('aria-pressed','false');});b.classList.add('activo');b.setAttribute('aria-pressed','true');});
});
function valorSegmento(grupo){return document.querySelector(`.segmentos[data-grupo="${grupo}"] .activo`).dataset.valor;}
function validar(){
  let ok=true;const signos={};
  for(const [id,r] of Object.entries(RANGOS)){
    const input=$(id),error=document.querySelector(`.error[data-para="${id}"]`),texto=input.value.trim().replace(',','.'),valor=Number(texto);
    let mensaje='';
    if(texto==='') mensaje='Campo obligatorio';
    else if(!Number.isFinite(valor)) mensaje='Debe ser un número';
    else if(valor<r.min||valor>r.max) mensaje=`Fuera de rango (${r.min}–${r.max})`;
    error.textContent=mensaje;input.classList.toggle('invalido',!!mensaje);input.setAttribute('aria-invalid',String(!!mensaje));if(mensaje)ok=false;signos[id]=valor;
  }
  signos.oxigeno=valorSegmento('oxigeno')==='si';signos.conciencia=valorSegmento('conciencia');signos.escala2=$('escala2').checked;
  return ok?signos:null;
}
function mostrar(resultado){
  const caja=$('resultado');caja.className=`panel resultado nivel-${resultado.riesgo.nivel}`;
  $('total').textContent=resultado.total;$('etiqueta').textContent=resultado.riesgo.etiqueta;$('respuesta').textContent=resultado.riesgo.respuesta;
  $('detalle').innerHTML=Object.entries(resultado.detalle).map(([k,p])=>`<tr class="${p===3?'tres':''}"><td>${NOMBRES_DETALLE[k]}</td><td>${p} puntos</td></tr>`).join('');
  caja.querySelector('details').open=false;$('mensaje-guardar').textContent='';caja.scrollIntoView({behavior:'smooth',block:'start'});
}
$('formulario').addEventListener('submit',e=>{
  e.preventDefault();const signos=validar();if(!signos){const primer=$('formulario').querySelector('.invalido');if(primer)primer.focus();$('resultado').classList.add('oculto');ultimoCalculo=null;return;}
  ultimoCalculo={signos,resultado:NEWS2.calcular(signos),cama:$('cama').value.trim()};mostrar(ultimoCalculo.resultado);
});
$('nueva-evaluacion').addEventListener('click',()=>{
  $('formulario').reset();document.querySelectorAll('.segmentos').forEach(g=>{g.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('activo',i===0);b.setAttribute('aria-pressed',String(i===0));});});
  document.querySelectorAll('.error').forEach(e=>e.textContent='');document.querySelectorAll('.invalido').forEach(i=>{i.classList.remove('invalido');i.removeAttribute('aria-invalid');});
  ultimoCalculo=null;$('resultado').classList.add('oculto');$('formulario').scrollIntoView({behavior:'smooth'});
});
function leerHistorial(){try{const r=JSON.parse(localStorage.getItem(CLAVE_HISTORIAL));return Array.isArray(r)?r:[];}catch{return [];}}
function guardarHistorial(registros){try{localStorage.setItem(CLAVE_HISTORIAL,JSON.stringify(registros));return true;}catch{return false;}}
const formatoFecha=valor=>{const d=new Date(valor);return isNaN(d.getTime())?'Fecha no disponible':d.toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'});};
const resumenValores=s=>{if(!s)return '<p>No hay signos vitales en este registro.</p>';return `<p>FR: ${escapar(s.fr)} resp/min · SpO₂: ${escapar(s.spo2)} %</p><p>TAS: ${escapar(s.tas)} mmHg · FC: ${escapar(s.fc)} lpm · Temp: ${escapar(s.temp)} °C</p><p>Oxígeno: ${s.oxigeno?'Sí':'No'} · Conciencia: ${escapar(s.conciencia)} · Escala ${s.escala2?'2':'1'}</p>`;};
function pintarHistorial(){
  const registros=leerHistorial(),lista=$('lista-historial');lista.replaceChildren();
  if(!registros.length){const li=document.createElement('li');li.className='vacio';li.textContent='Todavía no hay evaluaciones guardadas.';lista.append(li);return;}
  registros.forEach((r,i)=>{});
  for(let i=registros.length-1;i>=0;i--){
    const r=registros[i],nivel=['alto','medio','bajo-medio','bajo','cero'].includes(r.nivel)?r.nivel:'cero';
    const li=document.createElement('li');li.className='registro';
    const titulo=escapar(r.cama||'Sin identificador');const puntaje=Number.isFinite(Number(r.total))?Number(r.total):'—';
    li.innerHTML=`<div class="registro-cabecera"><div><div class="registro-nombre">${titulo}</div><div class="registro-fecha">${escapar(formatoFecha(r.fecha))}</div></div><div class="registro-puntaje ${nivel}"><strong>${puntaje}</strong>${escapar(nivel.toUpperCase())}</div></div><div class="registro-acciones"><button type="button" class="ver-detalle" aria-expanded="false">Ver detalles ▾</button><button type="button" class="eliminar">Eliminar</button></div><div class="registro-detalle oculto">${resumenValores(r.signos)}</div>`;
    const detalle=li.querySelector('.registro-detalle'),ver=li.querySelector('.ver-detalle');ver.addEventListener('click',()=>{const abierto=detalle.classList.toggle('oculto')===false;ver.setAttribute('aria-expanded',String(abierto));ver.textContent=abierto?'Ocultar detalles ▴':'Ver detalles ▾';});
    li.querySelector('.eliminar').addEventListener('click',()=>{if(!window.confirm('¿Eliminar esta evaluación del historial? Esta acción no se puede deshacer.'))return;const copia=leerHistorial();copia.splice(i,1);if(guardarHistorial(copia))pintarHistorial();else window.alert('No fue posible actualizar el historial.');});lista.append(li);
  }
}
$('guardar').addEventListener('click',()=>{
  if(!ultimoCalculo)return;const registros=leerHistorial();registros.push({fecha:new Date().toISOString(),cama:ultimoCalculo.cama,signos:ultimoCalculo.signos,total:ultimoCalculo.resultado.total,nivel:ultimoCalculo.resultado.riesgo.nivel});
  $('mensaje-guardar').textContent=guardarHistorial(registros)?'✓ Evaluación guardada en este dispositivo.':'No se pudo guardar (almacenamiento no disponible).';pintarHistorial();
});
pintarHistorial();
if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('SW no registrado:',err));}
