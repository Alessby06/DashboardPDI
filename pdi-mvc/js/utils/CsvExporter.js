// Utilidad: Exportador Tabular de Datos CSV
export const CsvExporter = {
  exportBeneficiarios(beneficiarios) {
    let csv = "Codigo,Nombres,Apellidos,DNI,Edad,Sexo,Distrito,Sede,Servicios,Seguro,Hb,Anemia,Vulnerabilidad\n";
    beneficiarios.forEach(b => {
      csv += `"${b.codigo}","${b.nombres}","${b.apellidos}","${b.dni}","${b.edad}","${b.sexo}","${b.distrito}","${b.sede}","${b.servicios.join(';') }","${b.seguro}",${b.hb},"${b.anemia}",${b.vulnerabilidad}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "padron_pdi_beneficiarios_2026.csv";
    link.click();
  }
};

if (typeof window !== "undefined") {
  window.PDI = window.PDI || {};
  window.PDI.CsvExporter = CsvExporter;
}
