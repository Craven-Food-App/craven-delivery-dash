// src/lib/governance/flows.ts

import { loadTemplateHtml, interpolateTemplate, type GovernanceTemplateId } from '../templates/index';
import { buildCommonContext, buildAppointmentContext } from '@/lib/templates/governanceContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Map governance template IDs to board_documents.type enum values
 */
function mapTemplateIdToType(templateId: GovernanceTemplateId): string {
  const mapping: Record<GovernanceTemplateId, string> = {
    'pre_incorporation_consent': 'initial_director_consent',
    'initial_action_sole_director': 'initial_director_consent',
    'org_minutes_sole_director': 'board_minutes',
    'officer_appointment_resolution': 'officer_appointment_resolution',
    'ceo_appointment_resolution': 'ceo_appointment_resolution',
    'officer_acceptance': 'multi_role_officer_acceptance',
    'stock_issuance_resolution': 'stock_issuance_resolution',
    'cap_table_exhibit': 'capitalization_table_exhibit',
    'banking_resolution': 'corporate_banking_resolution',
    'registered_agent_resolution': 'board_resolution',
  };
  return mapping[templateId] || 'board_resolution';
}

/**
 * When board is initialized / incorporator runs setup
 */
export async function handleInitialBoardSetup(directorUserId: string): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const common = await buildCommonContext();

  // Get director info
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', directorUserId)
    .maybeSingle();

  const { data: execUser } = await supabase
    .from('exec_users')
    .select('*')
    .eq('user_id', directorUserId)
    .maybeSingle();

  const directorName = 
    profile?.full_name || 
    execUser?.title || 
    user.email?.split('@')[0] || 
    'Torrance Stroman';
  const directorEmail = execUser?.email || user.email || '';

  const directorContext = {
    ...common,
    incorporator_name: directorName,
    incorporator_email: directorEmail,
    incorporator_address: profile?.address || '',
    director_name: directorName,
    director_email: directorEmail,
    director_address: profile?.address || '',
    officer_name: directorName,
    officer_email: directorEmail,
    officer_address: profile?.address || '',
    consent_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    director_consent_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    minutes_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    meeting_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };

  const templatesToGenerate: GovernanceTemplateId[] = [
    'initial_action_sole_director',
    'org_minutes_sole_director',
  ];

  const documentIds: string[] = [];

  for (const id of templatesToGenerate) {
    try {
      const { meta, html } = await loadTemplateHtml(id);
      const merged = interpolateTemplate(html, directorContext);

      // Insert into board_documents (existing table)
      const { data: doc, error } = await supabase
        .from('board_documents')
        .insert({
          title: meta.title,
          type: mapTemplateIdToType(id),
          html_template: merged,
          signing_status: 'pending',
          signers: JSON.stringify([]),
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${id}:`, error);
        continue;
      }

      if (doc) {
        documentIds.push(doc.id);
      }
    } catch (error) {
      console.error(`Error processing template ${id}:`, error);
    }
  }

  return documentIds;
}

/**
 * When an officer is appointed (generic per appointee)
 */
export async function handleOfficerAppointment(appointmentId: string): Promise<string[]> {
  // Get appointment from appointments table
  const { data: appt } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (!appt) throw new Error('Appointment not found');

  const ctx = await buildAppointmentContext({
    companyId: undefined, // Single company setup - uses company_settings
    appointeeUserId: appt.appointee_user_id,
    roleTitles: appt.role_titles,
    appointmentDate: appt.effective_date,
    isPreIncorporation: false,
  });

  const baseTemplates: GovernanceTemplateId[] = [
    'officer_appointment_resolution',
    'officer_acceptance',
  ];

  const finalTemplates: GovernanceTemplateId[] = [...baseTemplates];

  const isCEO = appt.role_titles.includes('CEO') || 
                appt.role_titles.includes('Chief Executive Officer');
  if (isCEO) {
    finalTemplates.push('ceo_appointment_resolution');
  }

  const documentIds: string[] = [];

  for (const id of finalTemplates) {
    try {
      const { meta, html } = await loadTemplateHtml(id);
      const merged = interpolateTemplate(html, ctx);

      const { data: doc, error } = await supabase
        .from('board_documents')
        .insert({
          title: meta.title,
          type: mapTemplateIdToType(id),
          html_template: merged,
          signing_status: 'pending',
          signers: JSON.stringify([]),
          related_appointment_id: appointmentId,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${id}:`, error);
        continue;
      }

      if (doc) {
        documentIds.push(doc.id);
        
        // Link to appointment
        await supabase.from('appointment_documents').insert({
          appointment_id: appointmentId,
          governance_document_id: doc.id,
        });
      }
    } catch (error) {
      console.error(`Error processing template ${id}:`, error);
    }
  }

  // Create resolution for this appointment
  try {
    const { data: resolution } = await supabase.functions.invoke('governance-create-resolution', {
      body: {
        title: `Appointment of ${ctx.officer_name} as ${appt.role_titles.join(', ')}`,
        description: `Board resolution to appoint ${ctx.officer_name} to the position of ${appt.role_titles.join(', ')}`,
        type: 'EXECUTIVE_APPOINTMENT',
        effective_date: appt.effective_date,
        appointment_id: appointmentId,
        metadata: {
          appointment_id: appointmentId,
          role_titles: appt.role_titles,
        },
      },
    });

    if (resolution?.resolution) {
      // Update resolution status to PENDING_VOTE
      await supabase
        .from('governance_board_resolutions')
        .update({ status: 'PENDING_VOTE' })
        .eq('id', resolution.resolution.id);
    }
  } catch (resolutionError) {
    console.error('Failed to create resolution:', resolutionError);
    // Don't throw - documents were created successfully
  }

  // Create executive onboarding record
  try {
    await supabase
      .from('executive_onboarding')
      .upsert({
        appointment_id: appointmentId,
        user_id: appt.appointee_user_id,
        status: 'pending',
        documents_required: finalTemplates.map(id => ({ template_id: id, required: true })),
        documents_completed: [],
      }, {
        onConflict: 'appointment_id,user_id',
      });
  } catch (onboardingError) {
    console.error('Failed to create onboarding record:', onboardingError);
  }

  // Send email notification when documents are ready
  if (documentIds.length > 0) {
    try {
      await supabase.functions.invoke('send-appointment-documents-email', {
        body: {
          appointmentId,
          documentIds,
        },
      });
      console.log(`Email notification sent for appointment ${appointmentId}`);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't throw - document creation succeeded, email is secondary
    }
  }

  return documentIds;
}

/**
 * When equity is initially configured
 */
export async function handleEquitySetup(): Promise<string[]> {
  const common = await buildCommonContext();

  const templates: GovernanceTemplateId[] = [
    'stock_issuance_resolution',
    'cap_table_exhibit',
  ];

  const documentIds: string[] = [];

  for (const id of templates) {
    try {
      const { meta, html } = await loadTemplateHtml(id);
      const merged = interpolateTemplate(html, common);

      const { data: doc, error } = await supabase
        .from('board_documents')
        .insert({
          title: meta.title,
          type: mapTemplateIdToType(id),
          html_template: merged,
          signing_status: 'pending',
          signers: JSON.stringify([]),
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${id}:`, error);
        continue;
      }

      if (doc) {
        documentIds.push(doc.id);
      }
    } catch (error) {
      console.error(`Error processing template ${id}:`, error);
    }
  }

  return documentIds;
}

/**
 * When banking is configured
 */
export async function handleBankingSetup(officerUserId: string): Promise<string | null> {
  const common = await buildCommonContext();

  // Get officer info
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', officerUserId)
    .maybeSingle();

  const { data: execUser } = await supabase
    .from('exec_users')
    .select('*')
    .eq('user_id', officerUserId)
    .maybeSingle();

  const { data: { user } } = await supabase.auth.getUser();

  const officerName = 
    profile?.full_name || 
    execUser?.title || 
    user?.email?.split('@')[0] || 
    '';
  const officerEmail = execUser?.email || user?.email || '';

  // Get director info (usually same as founder)
  const { data: boardMembers } = await supabase
    .from('board_members')
    .select('*')
    .eq('status', 'Active')
    .order('appointment_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  const directorName = boardMembers?.full_name || officerName;
  const directorEmail = boardMembers?.email || officerEmail;

  const ctx = {
    ...common,
    officer_name: officerName,
    officer_email: officerEmail,
    officer_address: profile?.address || '',
    director_name: directorName,
    director_email: directorEmail,
    director_address: boardMembers?.email || profile?.address || '',
    resolution_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };

  try {
    const { meta, html } = await loadTemplateHtml('banking_resolution');
    const merged = interpolateTemplate(html, ctx);

    const { data: doc, error } = await supabase
      .from('board_documents')
      .insert({
        title: meta.title,
        type: mapTemplateIdToType('banking_resolution'),
        html_template: merged,
        signing_status: 'pending',
        signers: JSON.stringify([]),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating banking resolution:', error);
      return null;
    }

    return doc?.id || null;
  } catch (error) {
    console.error('Error processing banking resolution:', error);
    return null;
  }
}

/**
 * When registered agent is configured
 */
export async function handleRegisteredAgentSetup(
  directorUserId: string,
  agentName: string,
  agentAddress: string,
): Promise<string | null> {
  const common = await buildCommonContext();

  // Get director info
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', directorUserId)
    .maybeSingle();

  const { data: execUser } = await supabase
    .from('exec_users')
    .select('*')
    .eq('user_id', directorUserId)
    .maybeSingle();

  const { data: { user } } = await supabase.auth.getUser();

  const directorName = 
    profile?.full_name || 
    execUser?.title || 
    user?.email?.split('@')[0] || 
    '';
  const directorEmail = execUser?.email || user?.email || '';

  const ctx = {
    ...common,
    registered_agent_name: agentName,
    registered_agent_address: agentAddress,
    director_name: directorName,
    director_email: directorEmail,
    director_address: profile?.address || '',
    resolution_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };

  try {
    const { meta, html } = await loadTemplateHtml('registered_agent_resolution');
    const merged = interpolateTemplate(html, ctx);

    const { data: doc, error } = await supabase
      .from('board_documents')
      .insert({
        title: meta.title,
        type: mapTemplateIdToType('registered_agent_resolution'),
        html_template: merged,
        signing_status: 'pending',
        signers: JSON.stringify([]),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating registered agent resolution:', error);
      return null;
    }

    return doc?.id || null;
  } catch (error) {
    console.error('Error processing registered agent resolution:', error);
    return null;
  }
}

