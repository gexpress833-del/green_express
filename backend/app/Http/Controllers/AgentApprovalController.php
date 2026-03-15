<?php

namespace App\Http\Controllers;

use App\Models\AgentApproval;
use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AgentApprovalController extends Controller
{
    /**
     * Entreprise crée une demande d'approbation d'agent
     */
    public function requestAgent(Request $request)
    {
        $user = $request->user();
        
        // Vérifier que l'utilisateur est une entreprise
        if ($user->role !== 'entreprise') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les entreprises peuvent créer des agents.',
            ], 403);
        }

        // Récupérer la company de l'utilisateur
        $company = Company::where('contact_user_id', $user->id)->first();
        
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Entreprise non trouvée.',
            ], 404);
        }

        if ($company->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Votre entreprise n\'est pas encore approuvée. Veuillez attendre la validation administrative.',
            ], 403);
        }

        // Valider les données d'agent
        $data = $request->validate([
            'agent_name' => 'required|string|max:255',
            'agent_email' => 'required|email|unique:users,email|unique:agent_approvals,agent_email',
            'agent_phone' => 'nullable|string|max:20',
            'agent_position' => 'nullable|string|max:255',
        ]);

        try {
            // Créer une demande d'approbation agent
            $agentApproval = AgentApproval::create([
                'company_id' => $company->id,
                'agent_name' => $data['agent_name'],
                'agent_email' => $data['agent_email'],
                'agent_phone' => $data['agent_phone'] ?? null,
                'agent_position' => $data['agent_position'] ?? null,
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Demande de création d\'agent envoyée. Un administrateur examinera la demande.',
                'agent_approval' => $agentApproval,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la demande: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin approuve une demande d'agent
     */
    public function approveAgent(Request $request, AgentApproval $agentApproval)
    {
        $admin = $request->user();

        // Vérifier que c'est un admin
        if ($admin->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé. Seuls les administrateurs peuvent approuver les agents.',
            ], 403);
        }

        if ($agentApproval->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande a déjà été traitée.',
            ], 400);
        }

        try {
            // Générer un mot de passe temporaire
            $temporaryPassword = bin2hex(random_bytes(8));

            // Créer l'utilisateur agent
            $agent = User::create([
                'name' => $agentApproval->agent_name,
                'email' => $agentApproval->agent_email,
                'password' => Hash::make($temporaryPassword),
                'role' => 'agent',
                'company_id' => $agentApproval->company_id,
            ]);

            // Marquer la demande comme approuvée
            $agentApproval->update([
                'status' => 'approved',
                'approved_by' => $admin->id,
                'approved_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Agent approuvé et créé avec succès.',
                'agent' => $agent,
                'temporary_password' => $temporaryPassword,
                'note' => 'Le mot de passe temporaire doit être communiqué à l\'agent de manière sécurisée. L\'agent devra le changer à la première connexion.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin rejette une demande d'agent
     */
    public function rejectAgent(Request $request, AgentApproval $agentApproval)
    {
        $admin = $request->user();

        // Vérifier que c'est un admin
        if ($admin->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé. Seuls les administrateurs peuvent rejeter les demandes.',
            ], 403);
        }

        if ($agentApproval->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande a déjà été traitée.',
            ], 400);
        }

        $data = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $agentApproval->update([
                'status' => 'rejected',
                'rejection_reason' => $data['reason'],
                'approved_by' => $admin->id,
                'approved_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Demande rejetée.',
                'agent_approval' => $agentApproval,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lister les demandes d'agents (admin ou entreprise)
     */
    public function listAgentRequests(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            // Admin voit toutes les demandes
            $requests = AgentApproval::with(['company', 'approvedBy'])
                ->orderBy('created_at', 'desc')
                ->paginate(20);
        } elseif ($user->role === 'entreprise') {
            // Entreprise voit ses demandes
            $company = Company::where('contact_user_id', $user->id)->first();
            if (!$company) {
                return response()->json(['message' => 'Entreprise non trouvée'], 404);
            }
            $requests = AgentApproval::where('company_id', $company->id)
                ->with(['company', 'approvedBy'])
                ->orderBy('created_at', 'desc')
                ->paginate(20);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé.',
            ], 403);
        }

        return response()->json($requests);
    }
}
