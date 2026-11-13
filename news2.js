/* =====================================================================
   news2.js — Lógica clínica de NEWS2 (National Early Warning Score 2)
   Fuente: Royal College of Physicians (2017). National Early Warning
   Score (NEWS) 2. Londres: RCP.

   Este archivo NO toca la interfaz: solo recibe números y devuelve
   puntajes. Así la misma lógica se puede reutilizar en otra interfaz
   (por ejemplo, un bot de Telegram) y se puede probar por separado.

   USO EDUCATIVO — No es un dispositivo médico validado.

   VERSIÓN PARA ALUMNOS: completa los TODO 2 a 8. Abre pruebas.html
   para ver cuántas pruebas pasan (meta: todas en verde).
   ===================================================================== */

const NEWS2 = {

  /* 1. Frecuencia respiratoria — YA RESUELTA COMO EJEMPLO.
        Fíjate en el patrón: se revisa de menor a mayor y cada `if`
        regresa en cuanto encuentra su rango. */
  puntajeFR(fr) {
    if (fr <= 8)  return 3;
    if (fr <= 11) return 1;
    if (fr <= 20) return 0;
    if (fr <= 24) return 2;
    return 3;                       // ≥ 25
  },

  /* 2a. SpO2 — Escala 1 (la habitual) */
  puntajeSpO2Escala1(spo2) {
    // TODO 2: ≤91 → 3 · 92–93 → 2 · 94–95 → 1 · ≥96 → 0
    if (spo2 <= 91) return 3; 
    if (spo2 <= 93) return 2; 
    if (spo2 <= 95) return 1;
    return 0;
  },

  /* 2b. SpO2 — Escala 2: SOLO para pacientes con insuficiencia
         respiratoria hipercápnica (p. ej. EPOC) y por indicación médica.
         Meta de saturación 88–92 %. */
  puntajeSpO2Escala2(spo2, conOxigeno) {
    if (spo2 <= 83) return 3;
    if (spo2 <= 85) return 2;
    if (spo2 <= 87) return 1;
    if (spo2 <= 92) return 0;
    if (!conOxigeno) return 0;      // ≥ 93 respirando aire ambiente
    if (spo2 <= 94) return 1;       // 93–94 con O2
    if (spo2 <= 96) return 2;       // 95–96 con O2
    return 3;                       // ≥ 97 con O2
  },

  /* 3. ¿Aire ambiente u oxígeno suplementario? */
  puntajeOxigeno(conOxigeno) {
    // TODO 3: con oxígeno → 2 · aire ambiente → 0
    return conOxigeno ? 2 : 0;
  },

  /* 4. Presión arterial sistólica (mmHg) */
  puntajeTAS(tas) {
    // TODO 4: ≤90 → 3 · 91–100 → 2 · 101–110 → 1 · 111–219 → 0 · ≥220 → 3
    if (tas <= 90)  return 3;
    if (tas <= 100) return 2; 
    if (tas <= 110) return 1; 
    if (tas <= 219) return 0;
    return 3;
  },

  /* 5. Frecuencia cardiaca / pulso (latidos por minuto) */
  puntajeFC(fc) {
    // TODO 5: ≤40 → 3 · 41–50 → 1 · 51–90 → 0 · 91–110 → 1 · 111–130 → 2 · ≥131 → 3
    if (fc <= 40)  return 3;
    if (fc <= 50)  return 1; 
    if (fc <= 90)  return 0; 
    if (fc <= 110) return 1; 
    if (fc <= 130) return 2; 
    return 3;  
  },

  /* 6. Nivel de conciencia ACVPU
        A = Alerta · C = Confusión nueva · V = responde a la Voz
        P = responde al dolor (Pain) · U = No responde (Unresponsive) */
  puntajeConciencia(acvpu) {
    // TODO 6: 'A' → 0 · cualquier otra letra (C, V, P, U) → 3
    return acvpu === 'A' ? 0 : 3;
  },

  /* 7. Temperatura (°C) */
  puntajeTemp(t) {
    // TODO 7: ≤35.0 → 3 · 35.1–36.0 → 1 · 36.1–38.0 → 0 · 38.1–39.0 → 1 · ≥39.1 → 2
    //         Ojo: la temperatura tiene decimales.
    if (t <= 35.0) return 3;
    if (t <= 36.0) return 1; 
    if (t <= 38.0) return 0; 
    if (t <= 39.0) return 1; 
    return 2;  
  },

  /* Calcula todos los parámetros y el total.
     signos = { fr, spo2, oxigeno, tas, fc, conciencia, temp, escala2 } */
  calcular(signos) {
    const spo2 = signos.escala2
      ? this.puntajeSpO2Escala2(signos.spo2, signos.oxigeno)
      : this.puntajeSpO2Escala1(signos.spo2);

    const detalle = {
      fr:         this.puntajeFR(signos.fr),
      spo2:       spo2,
      oxigeno:    this.puntajeOxigeno(signos.oxigeno),
      tas:        this.puntajeTAS(signos.tas),
      fc:         this.puntajeFC(signos.fc),
      conciencia: this.puntajeConciencia(signos.conciencia),
      temp:       this.puntajeTemp(signos.temp),
    };

    const total = Object.values(detalle).reduce((a, b) => a + b, 0);
    const hayUnTres = Object.values(detalle).some(p => p === 3);

    return { detalle, total, riesgo: this.clasificarRiesgo(total, hayUnTres) };
  },

  /* Riesgo clínico y respuesta sugerida según el puntaje total.
     Regla especial: un solo parámetro con 3 puntos eleva el riesgo
     aunque el total sea bajo. */
  clasificarRiesgo(total, hayUnTres) {
    if (total >= 7) return { 
      nivel: 'alto', etiqueta: 'Riesgo ALTO', 
      respuesta: 'Respuesta de emergencia: valoración inmediata por equipo de paciente crítico. Monitoreo continuo.' };
    if (total >= 5) return { 
      nivel: 'medio', etiqueta: 'Riesgo MEDIO', 
      respuesta: 'Respuesta urgente: avisar al médico responsable. Signos vitales al menos cada hora.'};
    if (hayUnTres) return { 
      nivel: 'bajo-medio', etiqueta: 'Riesgo BAJO-MEDIO (un parámetro en 3)',
      respuesta: 'Avisar al médico para valorar si se escala la atención. Signos vitales al menos cada hora.'    
        }; 
    if (total >= 1) return { 
      nivel: 'bajo', etiqueta: 'Riesgo BAJO', 
      respuesta: 'Valoración por enfermería. Signos vitales al menos cada 4–6 horas.' };
    return { 
      nivel: 'cero', etiqueta: 'Sin riesgo agregado (0)', 
      respuesta: 'Monitoreo de rutina: signos vitales al menos cada 12 horas.' };  
  },
};

/* Permite usar el mismo archivo en Node.js para pruebas automáticas */
if (typeof module !== 'undefined') module.exports = NEWS2;
