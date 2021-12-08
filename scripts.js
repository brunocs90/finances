const Modal = {
    open() {
        document.querySelector('.modal-overlay').classList.add('active')
    },
    close() {
        document.querySelector('.modal-overlay').classList.remove('active')
    },

    setValues(transaction, index) {
        Form.description.value = transaction.description;
        Form.amount.value = Utils.reverseFormatAmount(transaction.amount);
        Form.date.value = Utils.reverseFormatDate(transaction.date);
        Form.edit.value = "true";
        Form.index = index;
    },
}

const cardTotal = {
    positive() {
        document.querySelector(".card.total").classList.remove("negative")
        document.querySelector(".card.total").classList.add("positive")
    },
    negative() {
        document.querySelector(".card.total").classList.remove("positive")
        document.querySelector(".card.total").classList.add("negative")
    }
}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem("dev.finances:transactions")) || [];
    },

    set(transactions) {
        localStorage.setItem("dev.finances:transactions", JSON.stringify(transactions));
    }
}

const Transaction = {
    all: Storage.get(),

    add(transaction) {
        if (transaction.edit === "true") {
            this.all[transaction.index] = transaction;
            transaction.edit = "false";
        } else {
            this.all.push(transaction);
        }
        App.reload();
    },

    remove(index) {
        this.all.splice(index, 1)
        App.reload()
    },

    edit(index) {
        Modal.setValues(this.all[index], index);
        Modal.open();
    },

    incomes() {
        return Transaction.all.filter(t => t.amount > 0)
            .map(item => item.amount)
            .reduce((acumulador, elemento) => acumulador += elemento, 0);
    },

    expenses() {
        return Transaction.all.filter(t => t.amount < 0)
            .map(item => item.amount)
            .reduce((acumulador, elemento) => acumulador + elemento, 0);
    },

    total() {
        return Transaction.incomes() + Transaction.expenses();
    }
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr');
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
        tr.dataset.index = index;

        this.transactionsContainer.appendChild(tr);
    },

    innerHTMLTransaction(transaction, index) {
        const CSSclass = transaction.amount > 0 ? "income" : "expense";
        const amount = Utils.formatCurrency(transaction.amount);
        const html = `
            <td class="description">${transaction.description}</td>
            <td class="${CSSclass}">${amount}</td>
            <td class="date">${transaction.date}</td>
            <td>
                <span onclick="Transaction.remove(${index})">
                    <i class="far fa-trash-alt fa-lg"></i>
                </span>
            </td>
            <td>
                <span onclick="Transaction.edit(${index})">
                    <i class="far fa-edit fa-lg"></i>
                </span>
            </td>
            `;
        return html;
    },

    changeCardColor() {
        Transaction.total() < 0 ? cardTotal.negative() : cardTotal.positive();
    },

    updateBalance() {
        document.getElementById('incomeDisplay').innerHTML = Utils.formatCurrency(Transaction.incomes());
        document.getElementById('expenseDisplay').innerHTML = Utils.formatCurrency(Transaction.expenses());
        document.getElementById('totalDisplay').innerHTML = Utils.formatCurrency(Transaction.total());
    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = "";
    }
}

const Utils = {
    formatAmount(value) {
        value = value * 100;
        return Math.round(value);
    },

    reverseFormatAmount(value) {
        value = value / 100;
        return Math.round(value);
    },

    formatDate(date) {
        const splittedDate = date.split("-");
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`;
    },

    reverseFormatDate(date) {
        return date.split("/").reverse().join("-");
    },

    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : "";

        value = String(value).replace(/\D/g, "");
        value = Number(value) / 100;
        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
        return signal + value;
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),
    edit: document.querySelector('input#edit'),
    index: document.querySelector('input#edit').dataset.index,

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value,
            edit: Form.edit.value,
            index: Form.index,
        }
    },

    validateFields() {
        const { description, amount, date } = Form.getValues();

        if (description.trim() === "" || amount.trim() === "" || date.trim() === "") {
            throw new Error("Por favor, preencha todos os campos");
        }
    },

    formatValues() {
        let { description, amount, date, edit, index } = Form.getValues();

        amount = Utils.formatAmount(amount);
        date = Utils.formatDate(date);

        return { description, amount, date, edit, index };
    },

    clearFields() {
        Form.description.value = "";
        Form.amount.value = "";
        Form.date.value = "";
        Form.edit.value = "false";
        Form.index = "";
    },

    submit(event) {
        event.preventDefault();

        try {
            Form.validateFields();

            const transaction = Form.formatValues();
            Transaction.add(transaction);

            Form.clearFields();
            Modal.close();
        } catch (error) {
            alert(error.message);
        }
    }
}


const App = {
    init() {
        Transaction.all.forEach((transaction, index) => {
            DOM.addTransaction(transaction, index);
        });

        DOM.updateBalance();
        DOM.changeCardColor();

        Storage.set(Transaction.all);
    },
    reload() {
        DOM.clearTransactions()
        App.init()
    },
}

App.init();
