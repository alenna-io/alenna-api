import { IGroupRepository } from '../../../adapters_interface/repositories';
import { Group, GroupStudent } from '../../../domain/entities';
import prisma from '../prisma.client';
import { GroupMapper, GroupStudentMapper } from '../mappers';
import { randomUUID } from 'crypto';

export class GroupRepository implements IGroupRepository {
  async findBySchoolYearId(schoolYearId: string, schoolId: string, includeDeleted: boolean = false): Promise<Group[]> {
    const groups = await prisma.group.findMany({
      where: {
        schoolYearId,
        deletedAt: includeDeleted ? undefined : null,
        // Verify school year belongs to the school
        schoolYear: {
          schoolId,
          deletedAt: null,
        },
        school: {
          id: schoolId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return groups.map(GroupMapper.toDomain);
  }

  async findByTeacherIdAndSchoolYearId(teacherId: string, schoolYearId: string, schoolId: string, includeDeleted: boolean = false): Promise<Group[]> {
    const groups = await prisma.group.findMany({
      where: {
        teacherId,
        schoolYearId,
        deletedAt: includeDeleted ? undefined : null,
        // Verify school year belongs to the school and teacher belongs to the school
        schoolYear: {
          schoolId,
          deletedAt: null,
        },
        teacher: {
          schoolId,
          deletedAt: null,
        },
        school: {
          id: schoolId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return groups.map(GroupMapper.toDomain);
  }

  async findById(id: string, schoolId: string): Promise<Group | null> {
    const group = await prisma.group.findFirst({
      where: {
        id,
        deletedAt: null,
        schoolId,
        // Verify school year belongs to the school
        schoolYear: {
          schoolId,
          deletedAt: null,
        },
      },
    });

    return group ? GroupMapper.toDomain(group) : null;
  }

  async findByTeacherSchoolYearAndName(teacherId: string, schoolYearId: string, schoolId: string, name: string | null, includeDeleted: boolean = false): Promise<Group | null> {
    const group = await prisma.group.findFirst({
      where: {
        teacherId,
        schoolYearId,
        name: name || null,
        deletedAt: includeDeleted ? undefined : null,
        schoolId,
        // Verify school year belongs to the school
        schoolYear: {
          schoolId,
          deletedAt: null,
        },
      },
    });

    return group ? GroupMapper.toDomain(group) : null;
  }

  async create(teacherId: string, schoolYearId: string, schoolId: string, name?: string | null): Promise<Group> {
    // Verify school year belongs to the school
    const schoolYear = await prisma.schoolYear.findFirst({
      where: {
        id: schoolYearId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!schoolYear) {
      throw new Error('School year not found or does not belong to the school');
    }

    // Verify teacher belongs to the school
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!teacher) {
      throw new Error('Teacher not found or does not belong to the school');
    }

    // Check if a group with the same teacher, schoolYear, and name already exists
    const existingGroup = await this.findByTeacherSchoolYearAndName(teacherId, schoolYearId, schoolId, name || null, false);
    
    if (existingGroup) {
      throw new Error('Group with this name already exists for this teacher and school year');
    }

    // Check if there's a soft-deleted group we can restore
    const softDeletedGroup = await this.findByTeacherSchoolYearAndName(teacherId, schoolYearId, schoolId, name || null, true);
    
    if (softDeletedGroup && softDeletedGroup.deletedAt) {
      // Restore soft-deleted group
      const restored = await prisma.group.update({
        where: { id: softDeletedGroup.id },
        data: { 
          deletedAt: null,
          name: name || null,
        },
      });
      return GroupMapper.toDomain(restored);
    }

    // Create new group
    const created = await prisma.group.create({
      data: {
        id: randomUUID(),
        name: name || null,
        teacherId,
        schoolYearId,
        schoolId,
      },
    });

    return GroupMapper.toDomain(created);
  }

  async update(id: string, schoolId: string, data: Partial<Pick<Group, 'name'>>): Promise<Group> {
    // Verify group exists and belongs to the school
    const existing = await this.findById(id, schoolId);
    if (!existing) {
      throw new Error('Group not found');
    }

    // If updating name, check for conflicts
    if (data.name !== undefined && data.name !== existing.name) {
      const conflictingGroup = await this.findByTeacherSchoolYearAndName(
        existing.teacherId,
        existing.schoolYearId,
        schoolId,
        data.name,
        false
      );
      
      if (conflictingGroup && conflictingGroup.id !== id) {
        throw new Error('Group with this name already exists for this teacher and school year');
      }
    }

    const updated = await prisma.group.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name || null }),
      },
    });

    return GroupMapper.toDomain(updated);
  }

  async delete(id: string, schoolId: string): Promise<void> {
    // Verify group exists and belongs to the school
    const existing = await this.findById(id, schoolId);
    if (!existing) {
      throw new Error('Group not found');
    }

    // Soft delete the group (this will also soft delete all GroupStudent records via cascade or manual update)
    // First, soft delete all GroupStudent records
    await prisma.groupStudent.updateMany({
      where: {
        groupId: id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Then soft delete the group
    await prisma.group.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getGroupStudents(groupId: string, schoolId: string, includeDeleted: boolean = false): Promise<GroupStudent[]> {
    // Verify group exists and belongs to the school
    const group = await this.findById(groupId, schoolId);
    if (!group) {
      throw new Error('Group not found');
    }

    const groupStudents = await prisma.groupStudent.findMany({
      where: {
        groupId,
        deletedAt: includeDeleted ? undefined : null,
        // Verify student belongs to the school
        student: {
          schoolId,
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return groupStudents.map(GroupStudentMapper.toDomain);
  }

  async addStudentToGroup(groupId: string, studentId: string, schoolId: string): Promise<GroupStudent> {
    // Verify group exists and belongs to the school
    const group = await this.findById(groupId, schoolId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Verify student belongs to the school
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new Error('Student not found or does not belong to the school');
    }

    // Check if student is already in this group (active)
    const existingGroupStudent = await prisma.groupStudent.findFirst({
      where: {
        groupId,
        studentId,
        deletedAt: null,
      },
    });

    if (existingGroupStudent) {
      throw new Error('Student is already in this group');
    }

    // Check if student is in another group for this school year
    const isInOtherGroup = await this.isStudentInGroupForSchoolYear(studentId, group.schoolYearId, groupId);
    if (isInOtherGroup) {
      throw new Error('Student is already assigned to another group for this school year. Please remove them from the other group first.');
    }

    // Check if there's a soft-deleted GroupStudent we can restore
    const softDeletedGroupStudent = await prisma.groupStudent.findFirst({
      where: {
        groupId,
        studentId,
        deletedAt: { not: null },
      },
    });

    if (softDeletedGroupStudent) {
      // Restore soft-deleted GroupStudent
      const restored = await prisma.groupStudent.update({
        where: { id: softDeletedGroupStudent.id },
        data: { deletedAt: null },
      });
      return GroupStudentMapper.toDomain(restored);
    }

    // Create new GroupStudent
    const created = await prisma.groupStudent.create({
      data: {
        id: randomUUID(),
        groupId,
        studentId,
      },
    });

    return GroupStudentMapper.toDomain(created);
  }

  async removeStudentFromGroup(groupId: string, studentId: string, schoolId: string): Promise<void> {
    // Verify group exists and belongs to the school
    const group = await this.findById(groupId, schoolId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Find the GroupStudent record
    const groupStudent = await prisma.groupStudent.findFirst({
      where: {
        groupId,
        studentId,
        deletedAt: null,
      },
    });

    if (!groupStudent) {
      throw new Error('Student is not in this group');
    }

    // Soft delete the GroupStudent
    await prisma.groupStudent.update({
      where: { id: groupStudent.id },
      data: { deletedAt: new Date() },
    });
  }

  async addStudentsToGroup(groupId: string, studentIds: string[], schoolId: string): Promise<GroupStudent[]> {
    if (studentIds.length === 0) {
      return [];
    }

    const created: GroupStudent[] = [];

    // Add students one by one to handle duplicates properly
    for (const studentId of studentIds) {
      try {
        const groupStudent = await this.addStudentToGroup(groupId, studentId, schoolId);
        created.push(groupStudent);
      } catch (error: any) {
        // Skip if already exists or other error (error will be thrown by addStudentToGroup method)
        if (!error.message.includes('already') && !error.message.includes('already assigned')) {
          throw error;
        }
      }
    }

    return created;
  }

  async exists(teacherId: string, schoolYearId: string, name: string | null): Promise<boolean> {
    const existing = await prisma.group.findFirst({
      where: {
        teacherId,
        schoolYearId,
        name: name || null,
        deletedAt: null,
      },
    });

    return existing !== null;
  }

  async isStudentInGroupForSchoolYear(studentId: string, schoolYearId: string, excludeGroupId?: string): Promise<boolean> {
    // Check if student is in any active group for this school year (excluding the specified group)
    const groupStudent = await prisma.groupStudent.findFirst({
      where: {
        studentId,
        deletedAt: null,
        group: {
          schoolYearId,
          deletedAt: null,
          ...(excludeGroupId && { id: { not: excludeGroupId } }),
        },
      },
    });

    return groupStudent !== null;
  }

  async getStudentAssignmentsForSchoolYear(schoolYearId: string, schoolId: string): Promise<Array<{ studentId: string; groupId: string }>> {
    const assignments = await prisma.groupStudent.findMany({
      where: {
        deletedAt: null,
        group: {
          schoolYearId,
          deletedAt: null,
          schoolId,
        },
      },
      select: {
        studentId: true,
        groupId: true,
      },
    });

    return assignments;
  }
}
