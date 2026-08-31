/**
 * Plan de alimentación real del usuario (Lic. Floreani Carla, nutricionista).
 * Fuente única del contenido de la vista Nutrición. Transcripción fiel del plan;
 * si el nutri lo actualiza, se edita acá.
 */

export const PLAN_AUTHOR = "Lic. Floreani Carla · Nutricionista";
export const PLAN_PERIOD = "Agosto 2026";

export interface Meal {
  id: "desayuno" | "almuerzo" | "merienda" | "cena";
  name: string;
  time: string;
  base?: string[]; // componentes fijos
  options: string[]; // alternativas ("ó")
  notes?: string[];
}

export const MEALS: Meal[] = [
  {
    id: "desayuno",
    name: "Desayuno",
    time: "7:30–8:30 h",
    base: ["Infusión a gusto", "+ ½ taza de leche ó 1 vaso de yogur descremado ó 1 licuado de frutas (opcional)"],
    options: [
      "1 tostada integral (masa madre/centeno) con huevos revueltos (1 entero + 1 clara) ó queso port salut + tomate ó mantequilla de maní (1 cdita) ó ricota magra ó hummus. Podés sumar ¼ de palta.",
      "Bowl de cereales o granola (5 cdas) con yogur o leche + opcional banana + mantequilla de maní (1 cdita).",
      "Pancakes de avena (6 cdas) + 1 huevo + 1 clara + opcional ½ banana. Podés hacer varios y freezar. Con fruta fresca + mantequilla de maní.",
      "Porridge de avena (5 cdas + ½ taza de leche) con fruta fresca + mantequilla de maní.",
    ],
    notes: [
      "Podés sumar una fruta fresca a cualquier opción.",
      "Ideal romper el ayuno con 1 puñado de frutos secos.",
      "Se puede dividir en 2 → PRE-entreno: tostada (pan blanco) con miel o dulce de membrillo/batata · POST-entreno: tostada con huevos (3 claras) ó pancake.",
    ],
  },
  {
    id: "almuerzo",
    name: "Almuerzo",
    time: "13:00 h",
    options: [
      "Proteína (elegí una): 1-2 bifes (180-200g) ó 1-2 milanesas (carne/pollo/cerdo) ó ¼ de pollo al horno ó 2-3 hamburguesas caseras ó 2-3 rodajas de carne al horno ó 180-200g de legumbres cocidas (veggie burger, seitán, soja no pre-frita, tofu) ó 2 huevos + 2 claras (omelette con queso port salut) ó 180g ricota magra ó 1 lata grande de atún al natural ó 2-3 filet de pescado (gatuzo, merluza, brótola).",
      "+ 1/3 del plato de hidratos (~10 cdas): arroz ó puré/papas ó batata ó ensalada de papa y huevo ó fideos ó quinoa ó cous cous ó polenta.",
      "+ 1/3 del plato de vegetales: ensalada (tomate, lechuga, rúcula…) ó puré de zapallo ó revuelto de zapallitos ó vegetales al horno/wok.",
    ],
    notes: [
      "Alternativa: 1-2 porciones de tarta (atún/pollo/vegetales con ricota, masa casera) + ensalada + 3 cdas de hidratos.",
      "Alternativa: pastel de papa ó guiso de lentejas (con papa/batata).",
      "Ojo con los almuerzos que compramos comida.",
    ],
  },
  {
    id: "merienda",
    name: "Merienda",
    time: "17:00–17:30 h",
    base: ["Infusión a gusto", "+ ½ taza de leche ó 1 yogur descremado ó 1 licuado de frutas (opcional)"],
    options: [
      "1 tostada integral con huevos revueltos (1+1 clara) ó queso port salut + tomate ó mantequilla de maní ó ricota magra ó hummus (+ ¼ palta opcional).",
      "Bowl de cereales/granola (5 cdas) con yogur o leche + opcional banana + mantequilla de maní.",
      "Pancakes de avena (6 cdas) + 1 huevo + 1 clara + opcional ½ banana, con fruta + mantequilla de maní.",
      "Porridge de avena (5 cdas + ½ taza de leche) con fruta + mantequilla de maní.",
    ],
    notes: [
      "⭐ Momento bisagra del día — prestarle atención.",
      "Para el trabajo: sándwich de port salut y tomate · yogur Ser Pro con granola · pancake · barrita de proteína (Kibar/Crudda/Pont/Integra) + banana · barrita de cereal + yogur + banana.",
    ],
  },
  {
    id: "cena",
    name: "Cena",
    time: "20:30 h",
    options: [
      "Proteína (elegí una): igual que el almuerzo (bifes, milanesas, pollo, hamburguesas, legumbres, huevos, ricota, atún, pescado).",
      "+ 1/3 del plato de hidratos (~8 cdas): arroz ó puré/papas ó batata ó fideos ó quinoa ó cous cous ó polenta.",
      "+ 1/3 del plato de vegetales: ensalada ó puré de zapallo ó zapallitos ó vegetales al horno/wok.",
    ],
    notes: [
      "Alternativa: tarta (atún/pollo/vegetales con ricota) + ensalada + 3 cdas de hidratos.",
      "Alternativa: pastel de papa ó guiso de lentejas.",
      "🚴 CENA PRE-FONDO: un buen plato de pastas con salsa muy liviana o aceite de oliva + queso de rallar + 1 pizca de sal.",
    ],
  },
];

/** Combustible durante entrenamientos largos (>60'). Clave para fondos. */
export const INTRA_TRAINING = {
  intro:
    "Para entrenamientos de más de 60'. Empezá a las 40-45' y repetí cada 40-45'. Practicá la tolerancia para la carrera.",
  perDose: "30 g de hidratos por toma =",
  options: [
    "1 gel con o sin cafeína (Nutremax, Gu, Chitaka, Ei, Race)",
    "5-8 gomitas (según marca)",
    "30 g de dulce de membrillo",
    "1 fruta mediana",
    "1 barrita de cereal (Cereal Mix)",
    "1 turrón",
    "3-4 dátiles",
    "40 g de pasas de uva",
  ],
  drink: "+ 500 ml de bebida isotónica (casera o comercial, ej. HYDROMAX)",
};

export const SUPPLEMENTS = [
  {
    name: "Creatina (monohidrato)",
    dose: "3-5 g por día, TODOS los días (entrenes o no).",
    how: "En cualquier momento; absorbe mejor con algo dulce. Ej: diluida en agua junto al desayuno. Marcas: ENA o Matter.",
  },
  {
    name: "Omega-3",
    dose: "Todos los días, cerca de las comidas.",
    how: "La cantidad de cápsulas depende de la marca. Marcas: Regulip 1000, Star, Innova Naturals (farmacias o Mercado Libre).",
  },
];

export const SNACKS = [
  "Yogur descremado solo o con fruta/granola/cereales (3 cdas)",
  "1 fruta fresca (1 banana por día)",
  "1 barrita de cereal de buena calidad (1 vez/día, no obligatoria)",
  "1 puñado de frutos secos",
  "2-3 dátiles",
  "1 barrita de proteína (Kibar/Integra/Crudda)",
];

export const RECOMMENDATIONS = [
  "Descansar 7-8 h por noche o más; cuidar la calidad (a la cama sin pantallas).",
  "Comer despacio, masticar bien, tardar al menos 20 min.",
  "Moderar aderezos comerciales; probar antes de agregar sal.",
  "Hacer las 4 comidas + colaciones si pasás >4 h sin comer o tenés hambre.",
  "Mantener el orden los fines de semana.",
  "Tomar al menos 1,5 L de agua/día (sin sed, sin boca seca, orina clara por la tarde).",
  "Moderar / evitar el alcohol.",
  "Máximo 3 yemas por día.",
  "Aceite: no más de 1 cda sopera de oliva por ensalada; si sumás palta u aceitunas, elegí UNA (1 cda aceite ó 8 aceitunas ó ¼ palta).",
  "Cocción saludable: evitar frituras y cocinar con mucho aceite.",
];

export const POSTRE =
  "Fruta fresca (evitar banana de postre y fruta como postre de la cena) ó ensalada de fruta (½ taza) ó helado casero de frutas ó postre lácteo/maicena (máx 2 veces/semana) ó 1 cuadradito de chocolate amargo. No es obligatorio.";

export const FREE_MEAL =
  "1 vez por semana: 1 plato de pastas ó 2-3 porciones de pizza ó 2-3 empanadas al horno ó 15-20 piezas de sushi ó 1 hamburguesa. No es obligatorio — somos seres sociales y está bien disfrutar.";
