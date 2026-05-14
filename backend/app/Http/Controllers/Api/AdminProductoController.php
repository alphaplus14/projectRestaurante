<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AdminProductoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $productos = Producto::query()
            ->with(['categoria:idCategoria,nombre,orden,activa'])
            ->join('categoria', 'producto.categoria_idCategoria', '=', 'categoria.idCategoria')
            ->orderBy('categoria.orden')
            ->orderBy('categoria.nombre')
            ->orderBy('producto.nombreProducto')
            ->select('producto.*')
            ->get();

        $categorias = Categoria::query()
            ->orderBy('orden')
            ->orderBy('nombre')
            ->get(['idCategoria', 'nombre', 'orden', 'activa']);

        return response()->json([
            'data' => $productos->map(fn (Producto $p) => $this->serializeProducto($p)),
            'categorias' => $categorias,
        ]);
    }

    public function show(Producto $producto): JsonResponse
    {
        $producto->loadMissing(['categoria:idCategoria,nombre,orden,activa']);

        return response()->json([
            'data' => $this->serializeProducto($producto),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);
        unset($data['imagen']);

        if ($request->hasFile('imagen')) {
            $data['imagen'] = $request->file('imagen')->store('productos', 'public');
        }

        $producto = Producto::create($data);
        $producto->loadMissing(['categoria:idCategoria,nombre,orden,activa']);

        return response()->json([
            'message' => 'Producto creado.',
            'data' => $this->serializeProducto($producto),
        ], 201);
    }

    public function update(Request $request, Producto $producto): JsonResponse
    {
        $data = $this->validatePayload($request, $producto);
        unset($data['imagen']);

        if ($request->hasFile('imagen')) {
            $this->deleteStoredImage($producto->imagen);
            $data['imagen'] = $request->file('imagen')->store('productos', 'public');
        }

        $producto->fill($data);
        $producto->save();
        $producto->loadMissing(['categoria:idCategoria,nombre,orden,activa']);

        return response()->json([
            'message' => 'Producto actualizado.',
            'data' => $this->serializeProducto($producto),
        ]);
    }

    /**
     * Deshabilitar/habilitar (preferido vs eliminar).
     */
    public function setActivo(Request $request, Producto $producto): JsonResponse
    {
        $data = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        $producto->activo = (bool) $data['activo'];
        $producto->save();

        return response()->json([
            'message' => $producto->activo ? 'Producto habilitado.' : 'Producto deshabilitado.',
            'data' => $this->serializeProducto($producto->fresh(['categoria:idCategoria,nombre,orden,activa'])),
        ]);
    }

    /**
     * Eliminar (solo si no tiene detalles de pedidos).
     */
    public function destroy(Producto $producto): JsonResponse
    {
        if ($producto->pedidoDetalles()->exists()) {
            return response()->json([
                'message' => 'Este producto tiene pedidos asociados. No se puede eliminar; desactívalo.',
            ], 409);
        }

        $this->deleteStoredImage($producto->imagen);
        $producto->delete();

        return response()->json([
            'message' => 'Producto eliminado.',
        ]);
    }

    private function deleteStoredImage(?string $path): void
    {
        if (! $path) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function validatePayload(Request $request, ?Producto $producto = null): array
    {
        if ($request->input('receta_idReceta') === '') {
            $request->merge(['receta_idReceta' => null]);
        }

        $categoriaId = $request->input('categoria_idCategoria');

        $data = $request->validate([
            'nombreProducto' => [
                'required',
                'string',
                'max:120',
                Rule::unique('producto', 'nombreProducto')
                    ->where(fn ($q) => $q->where('categoria_idCategoria', $categoriaId))
                    ->ignore($producto?->idProducto, 'idProducto'),
            ],
            'precio' => ['required', 'numeric', 'min:500'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'tipo' => ['required', 'string', 'in:PLATO,BEBIDA,COMBO'],
            'categoria_idCategoria' => ['required', 'integer', Rule::exists('categoria', 'idCategoria')],
            'receta_idReceta' => ['nullable', 'integer', Rule::exists('receta', 'idReceta')],
            'activo' => ['sometimes', 'boolean'],
            'imagen' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'],
        ]);

        return $data;
    }

    private function serializeProducto(Producto $p): array
    {
        $imagenUrl = null;
        if ($p->imagen) {
            $imagenUrl = asset('storage/'.$p->imagen);
        }

        return [
            'idProducto' => $p->idProducto,
            'nombreProducto' => $p->nombreProducto,
            'precio' => $p->precio,
            'descripcion' => $p->descripcion,
            'imagen' => $p->imagen,
            'imagenUrl' => $imagenUrl,
            'tipo' => $p->tipo,
            'activo' => (bool) $p->activo,
            'categoria_idCategoria' => $p->categoria_idCategoria,
            'receta_idReceta' => $p->receta_idReceta,
            'categoria' => $p->categoria ? [
                'idCategoria' => $p->categoria->idCategoria,
                'nombre' => $p->categoria->nombre,
                'orden' => $p->categoria->orden,
                'activa' => (bool) $p->categoria->activa,
            ] : null,
        ];
    }
}
