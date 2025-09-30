import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users, userRoles, workshops, roles, workshopAdmins, workshopAdminPermissions, contactMessages, roiCalculations, blogPosts } from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticateUser, requireRole } from "../middleware/auth";

const router = Router();

// Get all users with their roles and workshops
router.get('/users', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    // Get all users from main users table
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    // Get all workshop admins
    const allWorkshopAdmins = await db.select().from(workshopAdmins).orderBy(desc(workshopAdmins.createdAt));

    // Process regular users
    const regularUsersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        // Get user roles
        const userRoleData = await db.select({
          roleId: userRoles.roleId,
          roleName: roles.name,
          organizationId: userRoles.organizationId
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, user.id));

        // Get workshops owned by user
        const userWorkshops = await db.select({
          id: workshops.id,
          workshopId: workshops.id,
          workshopName: workshops.name,
          name: workshops.name,
          cnpj: workshops.uniqueCode,
          status: workshops.active,
          createdAt: workshops.createdAt
        })
        .from(workshops)
        .where(eq(workshops.ownerId, user.id));

        return {
          id: `user-${user.id}`,
          realId: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          company: user.company,
          userType: 'regular',
          isActive: true, // users table doesn't have isActive field
          createdAt: user.createdAt,
          roles: userRoleData || [],
          workshops: userWorkshops || []
        };
      })
    );

    // Process workshop admins
    const workshopAdminsWithData = await Promise.all(
      allWorkshopAdmins.map(async (admin) => {
        // Get workshop permissions for this admin
        const permissions = await db.select({
          workshopId: workshopAdminPermissions.workshopId,
          workshopName: workshops.name,
          canEdit: workshopAdminPermissions.canEdit,
          canViewReports: workshopAdminPermissions.canViewReports,
          canManageAppointments: workshopAdminPermissions.canManageAppointments
        })
        .from(workshopAdminPermissions)
        .innerJoin(workshops, eq(workshopAdminPermissions.workshopId, workshops.id))
        .where(eq(workshopAdminPermissions.adminId, admin.id));

        return {
          id: `workshop-admin-${admin.id}`,
          realId: admin.id,
          email: admin.email,
          username: null, // workshop admins don't have username
          name: admin.name,
          company: null, // workshop admins don't have company field
          userType: 'workshop_admin',
          isActive: admin.isActive,
          emailVerified: admin.emailVerified,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
          roles: [{
            roleId: null,
            roleName: admin.role || 'workshop_admin',
            organizationId: null
          }],
          workshops: permissions || []
        };
      })
    );

    // Combine all users
    const allUsersData = [...regularUsersWithRoles, ...workshopAdminsWithData];

    // Sort by creation date (newest first)
    allUsersData.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    res.json(allUsersData);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user details
router.get('/users/:id', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    const fullId = req.params.id;

    // Check if it's a regular user or workshop admin
    if (fullId.startsWith('user-')) {
      const userId = parseInt(fullId.replace('user-', ''));

      // Get user
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user roles
      const userRoleData = await db.select({
        roleId: userRoles.roleId,
        roleName: roles.name,
        organizationId: userRoles.organizationId
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

      // Get workshops owned by user
      const userWorkshops = await db.select({
        id: workshops.id,
        workshopId: workshops.id,
        workshopName: workshops.name,
        name: workshops.name,
        cnpj: workshops.uniqueCode,
        status: workshops.active,
        createdAt: workshops.createdAt
      })
      .from(workshops)
      .where(eq(workshops.ownerId, userId));

      const userDetails = {
        id: `user-${user[0].id}`,
        realId: user[0].id,
        email: user[0].email,
        username: user[0].username,
        name: user[0].name,
        company: user[0].company,
        userType: 'regular',
        isActive: true,
        createdAt: user[0].createdAt,
        roles: userRoleData || [],
        workshops: userWorkshops || []
      };

      res.json(userDetails);
    } else if (fullId.startsWith('workshop-admin-')) {
      const adminId = parseInt(fullId.replace('workshop-admin-', ''));

      // Get workshop admin
      const admin = await db.select().from(workshopAdmins).where(eq(workshopAdmins.id, adminId)).limit(1);

      if (!admin.length) {
        return res.status(404).json({ error: 'Workshop admin not found' });
      }

      // Get workshop permissions for this admin
      const permissions = await db.select({
        workshopId: workshopAdminPermissions.workshopId,
        workshopName: workshops.name,
        canEdit: workshopAdminPermissions.canEdit,
        canViewReports: workshopAdminPermissions.canViewReports,
        canManageAppointments: workshopAdminPermissions.canManageAppointments
      })
      .from(workshopAdminPermissions)
      .innerJoin(workshops, eq(workshopAdminPermissions.workshopId, workshops.id))
      .where(eq(workshopAdminPermissions.adminId, adminId));

      const adminDetails = {
        id: `workshop-admin-${admin[0].id}`,
        realId: admin[0].id,
        email: admin[0].email,
        username: null,
        name: admin[0].name,
        company: null,
        userType: 'workshop_admin',
        isActive: admin[0].isActive,
        emailVerified: admin[0].emailVerified,
        lastLogin: admin[0].lastLogin,
        createdAt: admin[0].createdAt,
        roles: [{
          roleId: null,
          roleName: admin[0].role || 'workshop_admin',
          organizationId: null
        }],
        workshops: permissions || []
      };

      res.json(adminDetails);
    } else {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Reset user password
router.post('/users/:id/reset-password', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    const fullId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (fullId.startsWith('user-')) {
      const userId = parseInt(fullId.replace('user-', ''));

      const result = await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId))
        .returning();

      if (!result.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'Password reset successfully' });
    } else if (fullId.startsWith('workshop-admin-')) {
      const adminId = parseInt(fullId.replace('workshop-admin-', ''));

      const result = await db.update(workshopAdmins)
        .set({ password: hashedPassword })
        .where(eq(workshopAdmins.id, adminId))
        .returning();

      if (!result.length) {
        return res.status(404).json({ error: 'Workshop admin not found' });
      }

      res.json({ message: 'Password reset successfully' });
    } else {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Toggle user active status (removed - field doesn't exist in schema)
// If you need this functionality, add an 'active' boolean field to the users table

// Delete user
router.delete('/users/:id', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    const fullId = req.params.id;

    if (fullId.startsWith('user-')) {
      const userId = parseInt(fullId.replace('user-', ''));

      // Don't allow deleting admin users
      const userRole = await db.select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(
          eq(userRoles.userId, userId),
          eq(roles.name, 'ADMIN')
        ))
        .limit(1);

      if (userRole.length > 0) {
        return res.status(403).json({ error: 'Cannot delete admin users' });
      }

      // Remove all foreign key references before deleting user
      console.log(`Cleaning up references for user ${userId}...`);

      // 1. Remove owner_id from any workshops owned by this user
      await db.update(workshops)
        .set({ ownerId: null })
        .where(eq(workshops.ownerId, userId));

      // 2. Delete contact messages from this user
      await db.delete(contactMessages).where(eq(contactMessages.userId, userId));

      // 3. Delete ROI calculations from this user
      await db.delete(roiCalculations).where(eq(roiCalculations.userId, userId));

      // 4. Delete blog posts from this user
      await db.delete(blogPosts).where(eq(blogPosts.authorId, userId));

      // 5. Delete user roles
      await db.delete(userRoles).where(eq(userRoles.userId, userId));

      // Finally, delete the user
      const result = await db.delete(users)
        .where(eq(users.id, userId))
        .returning();

      if (!result.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } else if (fullId.startsWith('workshop-admin-')) {
      const adminId = parseInt(fullId.replace('workshop-admin-', ''));

      // Delete workshop admin permissions first
      await db.delete(workshopAdminPermissions).where(eq(workshopAdminPermissions.adminId, adminId));

      // Delete workshop admin
      const result = await db.delete(workshopAdmins)
        .where(eq(workshopAdmins.id, adminId))
        .returning();

      if (!result.length) {
        return res.status(404).json({ error: 'Workshop admin not found' });
      }

      res.json({ message: 'Workshop admin deleted successfully' });
    } else {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Unlink workshop from user
router.delete('/users/:userId/workshops/:workshopId', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    const fullUserId = req.params.userId;
    const workshopId = parseInt(req.params.workshopId);

    console.log('Unlinking workshop:', { fullUserId, workshopId });

    if (!workshopId || isNaN(workshopId)) {
      return res.status(400).json({ error: 'Invalid workshop ID' });
    }

    // Check if it's a regular user or workshop admin
    if (fullUserId.startsWith('user-')) {
      const userId = parseInt(fullUserId.replace('user-', ''));

      if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Remove owner_id from workshop
      const updateResult = await db
        .update(workshops)
        .set({
          ownerId: null,
          updatedAt: new Date()
        })
        .where(eq(workshops.id, workshopId))
        .returning();

      console.log('Workshop update result:', updateResult);

      // Remove OFICINA_OWNER role for this workshop
      const oficinaOwnerRole = await db
        .select()
        .from(roles)
        .where(eq(roles.name, 'OFICINA_OWNER'))
        .limit(1);

      if (oficinaOwnerRole.length > 0) {
        const deleteResult = await db
          .delete(userRoles)
          .where(and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, oficinaOwnerRole[0].id),
            eq(userRoles.organizationId, workshopId)
          ))
          .returning();

        console.log('UserRole delete result:', deleteResult);
      }

      res.json({ message: 'Workshop unlinked successfully' });
    } else if (fullUserId.startsWith('workshop-admin-')) {
      const adminId = parseInt(fullUserId.replace('workshop-admin-', ''));

      if (!adminId || isNaN(adminId)) {
        return res.status(400).json({ error: 'Invalid admin ID' });
      }

      // Remove workshop admin permission
      const deleteResult = await db
        .delete(workshopAdminPermissions)
        .where(and(
          eq(workshopAdminPermissions.adminId, adminId),
          eq(workshopAdminPermissions.workshopId, workshopId)
        ))
        .returning();

      console.log('Permission delete result:', deleteResult);

      res.json({ message: 'Workshop permission removed successfully' });
    } else {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
  } catch (error) {
    console.error('Error unlinking workshop:', error);
    res.status(500).json({ error: 'Failed to unlink workshop' });
  }
});

// Add role to user
router.post('/users/:id/roles', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { roleId, organizationId } = req.body;

    const result = await db.insert(userRoles)
      .values({
        userId,
        roleId,
        organizationId: organizationId || null
      })
      .returning();

    res.json({ message: 'Role added successfully', userRole: result[0] });
  } catch (error) {
    console.error('Error adding role:', error);
    res.status(500).json({ error: 'Failed to add role' });
  }
});

// Remove role from user
router.delete('/users/:userId/roles/:roleId', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const roleId = parseInt(req.params.roleId);
    const { organizationId } = req.query;

    let query = db.delete(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      ));

    if (organizationId) {
      query = db.delete(userRoles)
        .where(and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId),
          eq(userRoles.organizationId, parseInt(organizationId as string))
        ));
    }

    const result = await query.returning();

    if (!result.length) {
      return res.status(404).json({ error: 'Role assignment not found' });
    }

    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({ error: 'Failed to remove role' });
  }
});

export default router;