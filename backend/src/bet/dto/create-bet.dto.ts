export class CreateBetDto {
    // ID du match sur lequel l'utilisateur parie
    matchId: number;

    // ID de l'équipe que l'utilisateur parie comme gagnante
    winningTeamId: number;

    // Montant de la mise (nombre décimal)
    amount: number;

    // Nous utiliserons 1 comme userId par défaut pour le TDD initial
    // L'authentification gérera le vrai userId plus tard.
    userId: number = 1;
}