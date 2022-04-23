var tipoProceso = document.getElementById('tipoProceso'),
    procesos = document.getElementById('procesos');

tipoProceso.addEventListener('change', function () {
    // obtengo el valor del tipoProceso
    var valor = tipoProceso.value;
    switch (valor) {
        case '1': // Diseño textil
            // quitar los procesos
            while (procesos.firstChild) {
                procesos.removeChild(procesos.firstChild);
            }
            // crear lista de procesos
            procesos.innerHTML += '<li><input type="checkbox" id="telares" name="telares" checked><label for="telares">Telares</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="enrrollado" name="enrrollado" checked><label for="enrrollado">Enrrollado y revision</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="planchado" name="planchado" checked><label for="planchado">Planchado</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="corte" name="corte" checked><label for="corte">Corte y empaque</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="despacho" name="despacho" checked><label for="despacho">Despacho</label></li>';

            break;
        
        case '2': // Flexo
            // quitar los procesos
            while (procesos.firstChild) {
                procesos.removeChild(procesos.firstChild);
            }
            // Lista de procesos
            procesos.innerHTML += '<li><input type="checkbox" id="preprensa" name="preprensa" checked><label for="preprensa">Preprensa Cireles</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="preproduccion" name="preproduccion" checked><label for="preproduccion">Preproduccion</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="impresion" name="impresion" checked><label for="impresion">Impresion</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="corte" name="corte" checked><label for="corte">Corte</label></li>';

            break;
    
        case '3': // Transfer
            // quitar los procesos
            while (procesos.firstChild) {
                procesos.removeChild(procesos.firstChild);
            }
            // Lista de procesos
            procesos.innerHTML += '<li><input type="checkbox" id="preprensa" name="preprensa" checked><label for="preprensa">Preprensa Cireles</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="preproduccion" name="preproduccion" checked><label for="preproduccion">Preproduccion</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="impresion" name="impresion" checked><label for="impresion">Impresion</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="screen" name="screen" checked><label for="screen">Screen</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="revision" name="revision" checked><label for="revision">Revision</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="corteLineal" name="corteLineal" checked><label for="corteLineal">Corte Lineal</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="corteUnitario" name="corteUnitario" checked><label for="corteUnitario">Corte Unitario</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="rollos" name="rollos" checked><label for="rollos">Rollos</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="empaque" name="empaque" checked><label for="empaque">Empaque y Despacho</label></li>';

            break;
        
        case '4': // Garras
            // quitar los procesos
            while (procesos.firstChild) {
                procesos.removeChild(procesos.firstChild);
            }
            // Lista de procesos
            procesos.innerHTML += '<li><input type="checkbox" id="preprensa" name="preprensa" checked><label for="preprensa">Preprensa</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="preproduccion" name="preproduccion" checked><label for="preproduccion">Preproduccion</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="screen" name="screen" checked><label for="screen">Screen</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="repujado" name="repujado" checked><label for="repujado">Repujado</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="troquelado" name="troquelado" checked><label for="troquelado">Troquelado</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="empaque" name="empaque" checked><label for="empaque">Empaque</label></li>';
            procesos.innerHTML += '<li><input type="checkbox" id="despacho" name="despacho" checked><label for="despacho">Despacho</label></li>';

            break;

        default:
            // quitar los procesos
            while (procesos.firstChild) {
                procesos.removeChild(procesos.firstChild);
            }
            break;
    }
    
});

