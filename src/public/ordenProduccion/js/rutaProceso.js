var tipoProceso = document.getElementById('tipoProceso'),
    procesos = document.getElementById('procesos');

//funcion para checkbox que pone text-Muted
function checkbox(checkbox) {
    //obtener id del checkbox
    var id = checkbox.id;
    //concatenar id para obtener el label
    var label = document.getElementById(id + 'Label');    

    if (checkbox.checked) {
        
        label.classList.remove('text-muted');

    } else {
        label.classList.add('text-muted');
    }
}

//invocar funcion checkbox



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
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="diseño" name="diseño" checked><label id="diseñoLabel" for="diseño"> Diseño</label></li>';
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="ordenProduccion" name="ordenProduccion" checked><label id="ordenProduccionLabel" for="ordenProduccion"> Orden de produccion</label></li>';
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="preProduccion" name="preProduccion" checked><label id="preProduccionLabel" for="preProduccion"> preProduccion</label></li>';
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="telar1" name="telar1" checked><label id="telar1Label" for="telar1"> Telar #1</label></li>';           
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="telar2" name="telar2" checked><label id="telar2Label" for="telar2"> Telar #2</label></li>';           
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="telar4" name="telar4" checked><label id="telar4Label" for="telar4"> Telar #4</label></li>';           
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="telar5" name="telar5" checked><label id="telar5Label" for="telar5"> Telar #5</label></li>';           
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="telar6" name="telar6" checked><label id="telar6Label" for="telar6"> Telar #6</label></li>';           
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="enrollado" name="enrollado" checked><label id="enrolladoLabel" for="enrollado"> Enrollado</label></li>';
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="planchado" name="planchado" checked><label id="planchadoLabel" for="planchado"> Planchado</label></li>';
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="corte" name="corte" checked><label id="corteLabel" for="corte"> Corte y empaque</label></li>';
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="inspeccion" name="inspeccion" checked><label id="inspeccionLabel" for="inspeccion"> Inspeccion Final</label></li>';
            procesos.innerHTML += '<li><input class="form-check-input" type="checkbox" onclick="checkbox(this)" id="despacho" name="despacho" checked><label id="despachoLabel" for="despacho"> Despacho</label></li>';
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

