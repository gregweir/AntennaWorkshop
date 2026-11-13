/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type JurisdictionCode = 'CA' | 'US' | 'GB' | 'AU';

export interface RegulatorySource {
  title: string;
  authority: string;
  url: string;
}

export interface JurisdictionProfile {
  code: JurisdictionCode;
  name: string;
  releaseStatus: 'initial' | 'planned' | 'research';
  sources: RegulatorySource[];
}

export const jurisdictionProfiles: JurisdictionProfile[] = [
  {
    code: 'CA',
    name: 'Canada',
    releaseStatus: 'initial',
    sources: [
      {
        title: 'RBR-4 — Standards for the Operation of Radio Stations in the Amateur Radio Service',
        authority: 'Innovation, Science and Economic Development Canada',
        url: 'https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/regulations-reference/rbr/rbr-4-standards-operation-radio-stations-amateur-radio-service'
      },
      {
        title: 'Safety Code 6',
        authority: 'Health Canada',
        url: 'https://www.canada.ca/en/health-canada/services/publications/health-risks-safety/limits-human-exposure-radiofrequency-electromagnetic-energy-range-3-300.html'
      },
      {
        title: 'TN-261 — Safety Code 6 RF Exposure Compliance Evaluation Template',
        authority: 'Innovation, Science and Economic Development Canada',
        url: 'https://www.ised-isde.canada.ca/site/spectrum-management-telecommunications/en/tn-261-safety-code-6-sc6-radio-frequency-exposure-compliance-evaluation-template-uncontrolled'
      }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    releaseStatus: 'initial',
    sources: [
      {
        title: '47 CFR § 1.1310 — Radiofrequency radiation exposure limits',
        authority: 'Federal Communications Commission',
        url: 'https://www.ecfr.gov/current/title-47/section-1.1310'
      },
      {
        title: 'OET Bulletin 65',
        authority: 'Federal Communications Commission',
        url: 'https://www.fcc.gov/general/oet-bulletins-line'
      }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    releaseStatus: 'initial',
    sources: [
      {
        title: 'Guidance on EMF compliance and enforcement',
        authority: 'Ofcom',
        url: 'https://www.ofcom.org.uk/spectrum/electromagnetic-fields/compliance-and-enforcement-guidance'
      }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    releaseStatus: 'research',
    sources: [
      {
        title: 'RPS S-1 — Standard for Limiting Exposure to Radiofrequency Fields',
        authority: 'Australian Radiation Protection and Nuclear Safety Agency',
        url: 'https://www.arpansa.gov.au/regulation-and-licensing/regulatory-publications/radiation-protection-series/codes-and-standards/rpss-1'
      }
    ]
  }
];
