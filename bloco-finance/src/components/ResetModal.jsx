export default function ResetModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2>Resetar dados?</h2>
        <p>Tem certeza? Todos os dados da Aba 2 voltarão para a base inicial definida na Aba 1. Esta ação não pode ser desfeita.</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}>Sim, resetar</button>
        </div>
      </div>
    </div>
  );
}
