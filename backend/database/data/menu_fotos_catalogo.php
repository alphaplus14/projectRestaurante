<?php

/**
 * Catálogo de platos según frontend/public/menu fotos/{carpeta}/{archivo}.
 * Clave: "{carpeta}/{slug-del-nombre}" (slug ASCII, minúsculas, guiones).
 */
return [
  'bebidas' => [
    'categoria' => 'Bebidas',
    'tipo' => 'BEBIDA',
    'orden' => 3,
    'items' => [
      'agua-con-gas' => [
        'nombre' => 'Agua con gas',
        'precio' => 4500,
        'descripcion' => 'Agua mineral con gas bien fría. Ideal para acompañar cualquier plato.',
      ],
      'jugo-de-aloe-vera' => [
        'nombre' => 'Jugo de aloe vera',
        'precio' => 9000,
        'descripcion' => 'Bebida natural de aloe vera, suave y refrescante. Preparación del día.',
      ],
      'jugo-de-mora-de-azul' => [
        'nombre' => 'Jugo de mora azul',
        'precio' => 9500,
        'descripcion' => 'Jugo recién exprimido de mora azul, dulce y ligeramente ácido.',
      ],
      'jugo-de-naranja' => [
        'nombre' => 'Jugo de naranja',
        'precio' => 8500,
        'descripcion' => 'Jugo de naranja natural, sin conservantes. Servido bien frío.',
      ],
      'limonada-de-cereza' => [
        'nombre' => 'Limonada de cereza',
        'precio' => 11000,
        'descripcion' => 'Limonada casera con toque de cereza. Perfecta para los días calurosos.',
      ],
      'limonada-de-coco' => [
        'nombre' => 'Limonada de coco',
        'precio' => 12000,
        'descripcion' => 'Limonada tropical con leche de coco y un toque de limón fresco.',
      ],
      'limonada-michelada' => [
        'nombre' => 'Limonada michelada',
        'precio' => 13000,
        'descripcion' => 'Limonada con borde salado y un toque especial de la casa. Versión sin alcohol.',
      ],
      'pina-colada' => [
        'nombre' => 'Piña colada',
        'precio' => 14000,
        'descripcion' => 'Cóctel cremoso de piña y coco, batido al momento. Sin alcohol.',
      ],
    ],
  ],
  'combos' => [
    'categoria' => 'Combos',
    'tipo' => 'COMBO',
    'orden' => 5,
    'items' => [
      'bandeja-paisa' => [
        'nombre' => 'Bandeja paisa',
        'precio' => 48000,
        'descripcion' => 'Frijoles, arroz, carne molida, chicharrón, huevo frito, plátano maduro, aguacate y arepa. Porción generosa.',
      ],
      'carne-pure-de-papas-y-jugo' => [
        'nombre' => 'Carne con puré y jugo',
        'precio' => 36000,
        'descripcion' => 'Lomo en salsa de la casa, puré de papas cremoso y jugo natural del día.',
      ],
      'perro-con-papas-y-gaseosa' => [
        'nombre' => 'Perro con papas y gaseosa',
        'precio' => 22000,
        'descripcion' => 'Perro caliente especial con salsas de la casa, papas a la francesa y gaseosa 400 ml.',
      ],
      'salsa-bbq-con-alitas-y-gaseosa' => [
        'nombre' => 'Alitas BBQ con gaseosa',
        'precio' => 28000,
        'descripcion' => 'Porción de alitas bañadas en salsa BBQ, papas rústicas y gaseosa 400 ml.',
      ],
      'sandwiches-con-jugo' => [
        'nombre' => 'Sándwich con jugo',
        'precio' => 25000,
        'descripcion' => 'Sándwich del día con pan artesanal, proteína a elección del chef y jugo natural.',
      ],
      'truchas-ensalada-y-jugo' => [
        'nombre' => 'Trucha con ensalada y jugo',
        'precio' => 42000,
        'descripcion' => 'Filete de trucha a la plancha, ensalada fresca de temporada y jugo natural.',
      ],
    ],
  ],
  'platos fuertes' => [
    'categoria' => 'Platos fuertes',
    'tipo' => 'PLATO',
    'orden' => 2,
    'items' => [
      'camarones-con-queso' => [
        'nombre' => 'Camarones con queso',
        'precio' => 38000,
        'descripcion' => 'Camarones salteados gratinados con queso fundido y hierbas frescas.',
      ],
      'carne-con-camarones-fritos' => [
        'nombre' => 'Carne con camarones fritos',
        'precio' => 45000,
        'descripcion' => 'Lomo de res a la parrilla con camarones empanizados crujientes y limón.',
      ],
      'carne-con-camarones' => [
        'nombre' => 'Carne con camarones',
        'precio' => 43000,
        'descripcion' => 'Carne jugosa acompañada de camarones al ajillo en mantequilla de ajo.',
      ],
      'carne-con-ensalada-cocida' => [
        'nombre' => 'Carne con ensalada cocida',
        'precio' => 32000,
        'descripcion' => 'Carne asada con ensalada de verduras cocidas al vapor y aderezo ligero.',
      ],
      'carne-con-papas' => [
        'nombre' => 'Carne con papas',
        'precio' => 35000,
        'descripcion' => 'Corte de res a la parrilla con papas fritas doradas y ensalada simple.',
      ],
      'estofado-de-casuelas' => [
        'nombre' => 'Estofado de cazuelas',
        'precio' => 34000,
        'descripcion' => 'Estofado casero de carne en cazuela de barro, cocinado a fuego lento con especias.',
      ],
      'mojarra-frita' => [
        'nombre' => 'Mojarra frita',
        'precio' => 42000,
        'descripcion' => 'Mojarra entera frita, servida con arroz, patacón, ensalada y limón. Plato estrella del mar.',
      ],
      'pollo-con-piel' => [
        'nombre' => 'Pollo con piel crocante',
        'precio' => 33000,
        'descripcion' => 'Pierna y muslo de pollo al horno con piel dorada y crujiente, acompañado de guarnición.',
      ],
    ],
  ],
  'postres' => [
    'categoria' => 'Postres',
    'tipo' => 'PLATO',
    'orden' => 4,
    'items' => [
      'brownie-de-chocolate' => [
        'nombre' => 'Brownie de chocolate',
        'precio' => 12000,
        'descripcion' => 'Brownie tibio de chocolate semiamargo. Opción con helado de vainilla.',
      ],
      'chocomiel' => [
        'nombre' => 'Chocomiel',
        'precio' => 10000,
        'descripcion' => 'Bebida caliente de chocolate con miel de flores. Reconfortante y dulce.',
      ],
      'dulce-de-limon' => [
        'nombre' => 'Dulce de limón',
        'precio' => 9000,
        'descripcion' => 'Postre cítrico de limón con textura suave y notas refrescantes.',
      ],
      'dulce-de-uvas' => [
        'nombre' => 'Dulce de uvas',
        'precio' => 9500,
        'descripcion' => 'Dulce tradicional de uvas moradas, preparado en casa.',
      ],
      'maracupina' => [
        'nombre' => 'Maracupiña',
        'precio' => 11000,
        'descripcion' => 'Fusión cremosa de maracuyá y piña en capas. Postre tropical de la casa.',
      ],
      'postre-de-fresa' => [
        'nombre' => 'Postre de fresa',
        'precio' => 10500,
        'descripcion' => 'Mousse suave de fresa con base de galleta y crema batida.',
      ],
      'postre-de-vanilla' => [
        'nombre' => 'Postre de vainilla',
        'precio' => 10000,
        'descripcion' => 'Flan cremoso de vainilla con caramelo. Clásico de la carta.',
      ],
    ],
  ],
];
