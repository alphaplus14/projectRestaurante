<?php

namespace App\Console\Commands;

use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportMenuFotosCommand extends Command
{
    protected $signature = 'menu:import-fotos
                            {--fresh-demo : Deshabilita los 5 productos demo del seeder anterior}';

    protected $description = 'Importa productos desde frontend/public/menu fotos (imagen, precio, descripción)';

    /** @var list<string> */
    private const DEMO_PRODUCTOS = [
        'Arroz con Pollo',
        'Papas Fritas',
        'Limonada',
        'Postre de la casa',
        'Combo Pollo + Bebida',
    ];

    public function handle(): int
    {
        $sourceDir = realpath(base_path('../frontend/public/menu fotos'));
        if ($sourceDir === false || ! is_dir($sourceDir)) {
            $this->error('No se encontró la carpeta frontend/public/menu fotos');

            return self::FAILURE;
        }

        if (! File::exists(public_path('storage'))) {
            $this->call('storage:link');
        }

        Storage::disk('public')->makeDirectory('productos');

        /** @var array<string, array{categoria: string, tipo: string, orden: int, items: array<string, array{nombre: string, precio: int, descripcion: string}>}> $catalogo */
        $catalogo = require database_path('data/menu_fotos_catalogo.php');

        $importados = 0;
        $omitidos = 0;

        foreach ($catalogo as $carpeta => $grupo) {
            $carpetaPath = $sourceDir.DIRECTORY_SEPARATOR.$carpeta;
            if (! is_dir($carpetaPath)) {
                $this->warn("Carpeta omitida (no existe): {$carpeta}");
                continue;
            }

            $categoria = Categoria::query()->firstOrCreate(
                ['nombre' => $grupo['categoria']],
                ['orden' => $grupo['orden'], 'activa' => true],
            );

            if ($categoria->orden !== $grupo['orden'] || ! $categoria->activa) {
                $categoria->orden = $grupo['orden'];
                $categoria->activa = true;
                $categoria->save();
            }

            $archivos = File::files($carpetaPath);

            foreach ($archivos as $archivo) {
                if (! in_array(strtolower($archivo->getExtension()), ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
                    continue;
                }

                $slug = $this->slugFromFilename($archivo->getFilename());
                $meta = $grupo['items'][$slug] ?? $this->fallbackMeta($archivo->getFilename(), $grupo['tipo']);

                if (! isset($grupo['items'][$slug])) {
                    $this->warn("Sin catálogo detallado para {$carpeta}/{$slug}; usando datos generados.");
                }

                $storageName = 'menu-'.$carpeta.'-'.$slug.'.'.$archivo->getExtension();
                $storagePath = 'productos/'.$storageName;

                Storage::disk('public')->put($storagePath, File::get($archivo->getPathname()));

                $producto = Producto::query()
                    ->where('nombreProducto', $meta['nombre'])
                    ->where('categoria_idCategoria', $categoria->idCategoria)
                    ->first();

                $payload = [
                    'nombreProducto' => $meta['nombre'],
                    'precio' => $meta['precio'],
                    'descripcion' => $meta['descripcion'],
                    'imagen' => $storagePath,
                    'tipo' => $grupo['tipo'],
                    'categoria_idCategoria' => $categoria->idCategoria,
                    'activo' => true,
                    'eliminado_en' => null,
                ];

                if ($producto) {
                    if ($producto->imagen && $producto->imagen !== $storagePath) {
                        Storage::disk('public')->delete($producto->imagen);
                    }
                    $producto->fill($payload);
                    $producto->save();
                    $this->line("Actualizado: {$meta['nombre']}");
                } else {
                    Producto::create($payload);
                    $this->line("Creado: {$meta['nombre']}");
                }

                $importados++;
            }
        }

        if ($this->option('fresh-demo')) {
            $deshabilitados = Producto::query()
                ->whereIn('nombreProducto', self::DEMO_PRODUCTOS)
                ->update(['activo' => false]);
            $this->info("Productos demo deshabilitados: {$deshabilitados}");
        }

        $this->info("Importación terminada. Productos procesados: {$importados}. Omitidos: {$omitidos}.");

        return self::SUCCESS;
    }

    private function slugFromFilename(string $filename): string
    {
        $base = pathinfo($filename, PATHINFO_FILENAME);
        $ascii = Str::ascii(mb_strtolower($base, 'UTF-8'));

        return trim(preg_replace('/[^a-z0-9]+/', '-', $ascii) ?? '', '-');
    }

    /**
     * @return array{nombre: string, precio: int, descripcion: string}
     */
    private function fallbackMeta(string $filename, string $tipo): array
    {
        $nombre = Str::title(str_replace(['_', '-'], ' ', pathinfo($filename, PATHINFO_FILENAME)));

        $precio = match ($tipo) {
            'BEBIDA' => 9000,
            'COMBO' => 32000,
            default => 28000,
        };

        return [
            'nombre' => $nombre,
            'precio' => $precio,
            'descripcion' => "Especialidad de la casa: {$nombre}. Preparación fresca al momento.",
        ];
    }
}
