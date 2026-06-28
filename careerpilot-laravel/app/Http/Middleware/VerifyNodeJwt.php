<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use App\Models\User;

class VerifyNodeJWT
{
    public function handle(Request $request, Closure $next): mixed
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'success' => false,
                'message' => 'No token provided.',
            ], 401);
        }

        $token = substr($authHeader, 7);

        try {
            $decoded = JWT::decode(
                $token,
                new Key(env('JWT_SECRET'), 'HS256')
            );
        } catch (ExpiredException) {
            return response()->json([
                'success' => false,
                'message' => 'Access token expired.',
            ], 401);
        } catch (SignatureInvalidException) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid token signature.',
            ], 401);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid token.',
            ], 401);
        }

        // Attach user ID to request for use in controllers
        $request->merge(['auth_user_id' => $decoded->id]);

        return $next($request);
    }
}