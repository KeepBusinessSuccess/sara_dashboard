const SARA_VIEW_LEVELS = Object.freeze({
  overview: 1,
  alerts: 1,
  training: 1,
  contingency: 1,
  safety: 1,
  crm: 2,
  billing: 2,
  commercial: 2,
  hr: 3,
  evaluations: 4,
  hierarchies: 5
});

function getAccessContext_() {
  const email = getAuthenticatedEmail_();
  if (!email) throw new Error('No fue posible identificar tu cuenta de Google.');
  const parts = email.split('@');
  if (parts.length !== 2 || parts[1] !== SARA_CONFIG.ALLOWED_DOMAIN) {
    throw new Error('Acceso exclusivo para cuentas @' + SARA_CONFIG.ALLOWED_DOMAIN + '.');
  }

  const people = rowsFromSheet_(SARA_CONFIG.SHEETS.HIERARCHIES, 5000);
  const person = people.find(row => normalizeText_(firstValue_(row, ['Correo'], '')).toLowerCase() === email);
  if (email === SARA_SUPER_ADMIN_EMAIL) {
    return {
      email: email,
      name: person ? normalizeText_(firstValue_(person, ['Nombre'], 'Innovación KBS')) : 'Innovación KBS',
      department: person ? normalizeText_(firstValue_(person, ['Departamento'], 'Innovación')) : 'Innovación',
      position: 'Superadministrador SARA',
      role: 'SUPER ADMIN',
      level: 5,
      permissions: { views: SARA_ALL_VIEWS.slice(), canManageAccess: true }
    };
  }

  if (!person) throw new Error('Tu cuenta no está registrada en Jerarquias.');
  const status = normalizeComparable_(firstValue_(person, ['Status', 'Estatus'], ''));
  if (!['ACTIVO', 'ACTIVE', '1', 'TRUE'].includes(status)) throw new Error('Tu acceso está inactivo.');
  const role = canonicalRole_(firstValue_(person, ['Rol'], ''));
  const level = roleLevel_(role);
  if (!level) throw new Error('Tu rol no tiene un nivel de acceso válido.');
  const views = getEffectiveViewsForUser_(email, role);
  return {
    email: email,
    name: normalizeText_(firstValue_(person, ['Nombre'], email)),
    department: normalizeText_(firstValue_(person, ['Departamento'], '')),
    position: normalizeText_(firstValue_(person, ['Puesto'], '')),
    role: role,
    level: level,
    permissions: { views: views, canManageAccess: false }
  };
}

function getEffectiveViewsForUser_(email, role) {
  const defaults = Object.keys(SARA_VIEW_LEVELS).filter(view => view !== 'hierarchies' && roleLevel_(role) >= SARA_VIEW_LEVELS[view]);
  const overrides = {};
  rowsFromSheet_(SARA_PERMISSIONS_SHEET, 10000)
    .filter(row => normalizeText_(firstValue_(row, ['Correo'], '')).toLowerCase() === normalizeText_(email).toLowerCase())
    .forEach(row => {
      const view = normalizeText_(firstValue_(row, ['Modulo'], '')).toLowerCase();
      const allowed = normalizeComparable_(firstValue_(row, ['Permitido'], ''));
      if (SARA_ALL_VIEWS.includes(view) && view !== 'hierarchies') overrides[view] = ['TRUE', 'SI', '1', 'PERMITIDO'].includes(allowed);
    });
  return SARA_ALL_VIEWS.filter(view => view !== 'hierarchies' && (Object.prototype.hasOwnProperty.call(overrides, view) ? overrides[view] : defaults.includes(view)));
}

function canonicalRole_(value) {
  const role = normalizeComparable_(value);
  if (['N1', 'TRABAJADOR'].includes(role)) return 'TRABAJADOR';
  if (['N2', 'LIDER'].includes(role)) return 'LÍDER';
  if (['N3', 'COORDINADOR'].includes(role)) return 'COORDINADOR';
  if (['N4', 'DIRECCION', 'DIRECTIVO'].includes(role)) return 'DIRECCIÓN';
  return '';
}

function roleLevel_(role) {
  return { 'TRABAJADOR': 1, 'LÍDER': 2, 'COORDINADOR': 3, 'DIRECCIÓN': 4, 'SUPER ADMIN': 5 }[role] || 0;
}

function requireView_(context, view) {
  if (!context || !context.permissions.views.includes(view)) throw new Error('No tienes permiso para consultar este módulo.');
}

function requireDirection_(context) {
  if (!context || context.level < 4) throw new Error('Esta acción requiere nivel Dirección.');
}

function requireSuperAdmin_(context) {
  if (!context || context.email !== SARA_SUPER_ADMIN_EMAIL || !context.permissions.canManageAccess) {
    throw new Error('Esta acción es exclusiva del superadministrador.');
  }
}

function publicContext_(context) {
  return {
    name: context.name,
    email: context.email,
    department: context.department,
    position: context.position,
    role: context.role,
    level: context.level
  };
}
