const API_URL = "http://localhost:5062"; // ajusta el puerto según tu back

// GET all suppliers
async function getSuppliers() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Error fetching suppliers");
        const data = await response.json();
        console.log("Suppliers:", data);
        return data;
    } catch (err) {
        console.error(err);
    }
}

// GET supplier by ID
async function getSupplierById(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Supplier not found");
        const data = await response.json();
        console.log("Supplier:", data);
        return data;
    } catch (err) {
        console.error(err);
    }
}

// POST create supplier
async function createSupplier(supplier) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(supplier)
        });

        if (!response.ok) throw new Error("Error creating supplier");
        const data = await response.json();
        console.log("Created:", data);
        return data;
    } catch (err) {
        console.error(err);
    }
}

// PUT update supplier
async function updateSupplier(id, supplier) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(supplier)
        });

        if (response.status === 204) {
            console.log("Supplier updated successfully");
        } else {
            throw new Error("Error updating supplier");
        }
    } catch (err) {
        console.error(err);
    }
}

// DELETE supplier
async function deleteSupplier(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (response.status === 204) {
            console.log("Supplier deleted successfully");
        } else {
            throw new Error("Error deleting supplier");
        }
    } catch (err) {
        console.error(err);
    }
}
