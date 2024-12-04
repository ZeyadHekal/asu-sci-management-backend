interface PrivilegeExpression {
	type: 'AND' | 'OR'; // Logical operator
	privileges: (string | PrivilegeExpression)[]; // Privileges or nested expressions
}
