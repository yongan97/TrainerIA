import type { Ingredient, Sauce } from "@/lib/kitchen/types";

const g = (key: string, name: string, qty: number, aisle: Ingredient["aisle"]): Ingredient => ({
  key, name, qty, unit: "g", aisle,
});
const u = (key: string, name: string, qty: number, aisle: Ingredient["aisle"]): Ingredient => ({
  key, name, qty, unit: "u", aisle,
});
const ml = (key: string, name: string, qty: number, aisle: Ingredient["aisle"]): Ingredient => ({
  key, name, qty, unit: "ml", aisle,
});
const cda = (key: string, name: string, qty: number, aisle: Ingredient["aisle"]): Ingredient => ({
  key, name, qty, unit: "cda", aisle,
});

/** Salsas que pidió. Sin chimichurri. El aderezo de todos los días va primero. */
export const SAUCES: Sauce[] = [
  {
    id: "aderezo",
    title: "Aderezo de todos los días",
    use: "El default de cualquier ensalada: oliva, sal y limón exprimido.",
    keeps: "Se arma en el plato. No se guarda.",
    minutes: 1,
    summary: "Aceite de oliva, sal y limón. Nada más.",
    ingredients: [
      cda("aceite-oliva", "Aceite de oliva", 1, "almacen"),
      u("limon", "Limón", 0.5, "verduleria"),
      g("sal", "Sal", 1, "almacen"),
    ],
    steps: [
      { text: "Poné la ensalada en el plato. Salala primero, antes del aceite." },
      { text: "Exprimí medio limón arriba. Sumá una cucharada sopera de aceite de oliva y mezclá." },
    ],
  },
  {
    id: "yogur",
    title: "Yogur, limón y ajo",
    use: "Para carne, milanesas y pescado blanco. Fresca y rápida.",
    keeps: "En un frasco, 3 días en la heladera.",
    minutes: 5,
    summary: "Yogur natural, ajo, limón y un chorrito de oliva.",
    ingredients: [
      g("yogur-natural", "Yogur natural", 200, "almacen"),
      u("ajo", "Diente de ajo", 1, "verduleria"),
      u("limon", "Limón", 0.5, "verduleria"),
      ml("aceite-oliva", "Aceite de oliva", 10, "almacen"),
      g("sal", "Sal", 1, "almacen"),
    ],
    steps: [
      { text: "Rallá o picá finito un diente de ajo. Si te cae fuerte, pasalo por un tenedor con una pizca de sal." },
      { text: "Mezclá el yogur, el ajo, el jugo de medio limón, el aceite y la sal. Probá." },
      { text: "Dejala reposar para que el ajo suelte sabor.", seconds: 600, timerLabel: "Reposo" },
    ],
  },
  {
    id: "pesto",
    title: "Pesto",
    use: "Pollo al horno, cuadril y pasta. Con albahaca o, si no hay, con rúcula.",
    keeps: "Tapado con un hilo de aceite, 4–5 días en la heladera.",
    minutes: 10,
    summary: "Albahaca, nuez, ajo, parmesano y oliva.",
    ingredients: [
      g("albahaca", "Albahaca (o rúcula)", 40, "verduleria"),
      g("nueces", "Nueces", 30, "almacen"),
      u("ajo", "Diente de ajo", 1, "verduleria"),
      g("parmesano", "Queso rallado (parmesano o reggianito)", 30, "almacen"),
      ml("aceite-oliva", "Aceite de oliva", 60, "almacen"),
      g("sal", "Sal", 1, "almacen"),
    ],
    steps: [
      { text: "Picá la albahaca, las nueces y el ajo. Si no tenés procesadora, va con cuchillo: no hace falta que quede un puré." },
      { text: "Mezclá con el queso. Sumá el aceite de a poco hasta que empaste. Salá." },
      { text: "Guardá en un frasco y cubrí con un chorrito de aceite para que no se ponga negro." },
    ],
  },
  {
    id: "hummus",
    title: "Hummus",
    use: "Al lado de la ensalada de garbanzos, o en una tostada de merienda.",
    keeps: "3–4 días en la heladera.",
    minutes: 8,
    summary: "Garbanzos de lata, tahini o oliva, limón y ajo.",
    ingredients: [
      u("garbanzos-lata", "Lata de garbanzos", 1, "almacen"),
      ml("aceite-oliva", "Aceite de oliva", 30, "almacen"),
      u("limon", "Limón", 0.5, "verduleria"),
      u("ajo", "Diente de ajo", 1, "verduleria"),
      g("sal", "Sal", 2, "almacen"),
    ],
    steps: [
      { text: "Enjuagá y escurrí los garbanzos. Guardá un par enteros para tirar arriba al servir." },
      { text: "Procesá con el ajo, el limón, el aceite y la sal. Si queda seco, sumá un chorrito del agua de la lata o agua." },
      { text: "Tiene que quedar cremoso, no un puré seco. Probá de sal y de limón." },
    ],
  },
  {
    id: "salsa-verde",
    title: "Salsa verde",
    use: "Merluza y verduras al horno. Perejil, oliva, limón, sin vinagre fuerte.",
    keeps: "2 días en la heladera.",
    minutes: 8,
    summary: "Perejil, ajo, oliva, limón y un toque de mostaza.",
    ingredients: [
      g("perejil", "Perejil", 30, "verduleria"),
      u("ajo", "Diente de ajo", 1, "verduleria"),
      ml("aceite-oliva", "Aceite de oliva", 40, "almacen"),
      u("limon", "Limón", 0.5, "verduleria"),
      g("mostaza", "Mostaza", 5, "almacen"),
      g("sal", "Sal", 1, "almacen"),
    ],
    steps: [
      { text: "Picá el perejil bien fino, con el ajo." },
      { text: "Mezclá con el aceite, el limón, la mostaza y la sal. Tiene que estar líquida, para cucharear arriba del pescado." },
    ],
  },
  {
    id: "vinagreta",
    title: "Vinagreta de mostaza y miel",
    use: "Ensaladas del día de atún rojo o cuando la ensalada pide algo más que limón.",
    keeps: "Una semana en un frasco, afuera de la heladera.",
    minutes: 4,
    summary: "Mostaza, miel, limón y oliva.",
    ingredients: [
      g("mostaza", "Mostaza", 15, "almacen"),
      g("miel", "Miel", 10, "almacen"),
      u("limon", "Limón", 0.5, "verduleria"),
      ml("aceite-oliva", "Aceite de oliva", 40, "almacen"),
      g("sal", "Sal", 1, "almacen"),
    ],
    steps: [
      { text: "Disolvé la mostaza y la miel con el jugo de limón y la sal." },
      { text: "Sumá el aceite batiendo con un tenedor hasta que emulgue. Si se corta, un chorrito más de limón y listo." },
    ],
  },
  {
    id: "tomate",
    title: "Salsa de tomate casera",
    use: "Pasta, milanesas y pollo salteado. Tomate cocido: el crudo no va.",
    keeps: "4 días en la heladera, o congelada en porciones.",
    minutes: 25,
    summary: "Tomate triturado de lata, ajo, oliva y orégano. Sin berenjena.",
    ingredients: [
      u("tomate-triturado", "Lata de tomate triturado", 1, "almacen"),
      u("ajo", "Dientes de ajo", 2, "verduleria"),
      ml("aceite-oliva", "Aceite de oliva", 15, "almacen"),
      g("oregano", "Orégano", 2, "almacen"),
      g("sal", "Sal", 2, "almacen"),
    ],
    steps: [
      { text: "Calentá el aceite y dorá el ajo picado, sin que se queme.", seconds: 60, timerLabel: "Ajo" },
      { text: "Sumá el tomate triturado, el orégano y la sal. Fuego medio-bajo." },
      { text: "Cociná hasta que espese y pierda el gusto a lata.", seconds: 1200, timerLabel: "Salsa" },
    ],
  },
];

export const SAUCE_BY_ID: Record<string, Sauce> = Object.fromEntries(SAUCES.map((s) => [s.id, s]));
