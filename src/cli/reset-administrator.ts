import promptSync from 'prompt-sync';
import { execQuery, initPool } from '../services/database.js';
import User from '../apis/user/UserModel.js';
import Role, { Permission } from '../apis/role/RoleModel.js';
import { RowDataPacket } from 'mysql2/promise';

const prompt = promptSync();

console.log('This script will reset the "Administrator" role.');
console.log('The role will include ALL permissions.');
console.log('If the role does not exist, it will be created.');
if (prompt('Do you want to continue? [y/N]: ') !== 'y') {
  console.log('Cancelling...');
  process.exit(1);
}

const getRoleId = async () => {
  const query = `
    SELECT
      roleId
    FROM
      roles
    WHERE
      name = 'Administrator'
  `;
  const [rows] = await execQuery<RowDataPacket[]>(query);
  if (rows.length === 1) {
    return rows[0].roleId;
  }
  return null;
};

const resetRole = async () => {
  const roleId = await getRoleId();
  if (roleId) {
    const role = new Role({ roleId });
    await role.read();
    role.permissions = Object.values(Permission);
    await role.update();
    console.log('Role updated');
    return role.roleId;
  } else {
    const role = new Role({
      name: 'Administrator',
      description: 'Full access',
      permissions: Object.values(Permission),
    });
    await role.create();
    console.log('Role created');
    return role.roleId;
  }
};

const createUser = async (roleId: string | null) => {
  const user = new User();
  const password = Math.random().toString(36).slice(-8);

  let formValidated = false;
  while (!formValidated) {
    const form = {
      timezone: 'UTC',
      theme: 'light',
      homePage: 'dashboard',
      isInactive: false,
      roles: [roleId],
      username: prompt('Enter the username of the user: '),
      email: prompt('Enter the email of the user: '),
      password,
      passwordConfirm: password,
      passwordIsExpired: true,
      firstName: prompt('Enter the first name of the user: '),
      lastName: prompt('Enter the last name of the user: '),
    };
    const errors = await user.validate(form);
    if (errors.length) {
      console.error(errors);
      continue;
    }
    formValidated = true;
  }

  await user.create();
  console.log('The following user was created:');
  console.log(`  Username: ${user.username}`);
  console.log(`  Password: ${password}`);
};

const getUserId = async (username: string) => {
  const query = `
    SELECT
      userId
    FROM
      users
    WHERE
      username = ?
  `;
  const values = [username];
  const [rows] = await execQuery<RowDataPacket[]>(query, values);
  if (rows.length === 1) {
    return rows[0].userId;
  }
  return null;
};

const updateUser = async (roleId: string | null) => {
  let userId = null;
  while (!userId) {
    userId = await getUserId(prompt('Enter the username of the user: '));
    if (!userId) {
      console.log('User not found');
    }
  }
  const user = new User({ userId });
  await user.read();
  user.roles = [roleId];
  await user.update();
  // prettier-ignore
  console.log(`The user '${user.username}' was promoted to the role 'Administrator'`);
};

try {
  initPool();

  const roleId = await resetRole();

  // prettier-ignore
  if (prompt('Create a new user and promote the user to the "Administrator" role? [y/N]: ') === 'y') {
    await createUser(roleId);
  } else if (prompt('Promote an existing user to the "Administrator" role? [y/N]: ') === 'y') {
    await updateUser(roleId);
  }

  process.exit(1);
} catch (err) {
  console.error(err);
  process.exit(0);
}
