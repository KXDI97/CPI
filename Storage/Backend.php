<?php
$serverName = "localhost"; // Si SQL Server está en otro host, cambia esto.
$database = "InventarioCPI";
$username = "KXDI"; // Usuario de SQL Server (cámbialo si usas otro)
$password = "tu_contraseña"; // Coloca la contraseña de tu usuario de SQL Server

try {
    $conn = new PDO("sqlsrv:server=$serverName;Database=$database", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "SELECT * FROM Storage";
    $stmt = $conn->query($sql);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($data);
} catch (PDOException $e) {
    echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
}
?>